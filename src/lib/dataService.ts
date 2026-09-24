import { supabase } from './supabase';
import type {
  AnalysisJob,
  Certificate,
  Finding,
  Session,
  DashboardStats,
  SeverityCounts,
} from './types';
import {
  generateSessionData,
  computeSeverityCounts,
  computePostureScore,
  computeProtocolBreakdown,
  computeTlsVersionDistribution,
  type SampleScenario,
} from './analyzer';

export interface CreateJobInput {
  filename: string;
  scenario: SampleScenario;
  sessionCount: number;
}

export async function createAnalysisJob(input: CreateJobInput): Promise<string> {
  const { data, error } = await supabase
    .from('analysis_jobs')
    .insert({
      filename: input.filename,
      status: 'analyzing',
      progress: 0,
      posture_score: 0,
      total_sessions: 0,
      severity_counts: {},
      protocol_breakdown: {},
      tls_version_distribution: {},
      summary: {},
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || 'Failed to create job');
  return data.id;
}

export async function updateJobProgress(jobId: string, progress: number): Promise<void> {
  await supabase.from('analysis_jobs').update({ progress }).eq('id', jobId);
}

export async function completeAnalysisJob(jobId: string): Promise<AnalysisJob | null> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('risk_level, protocol, tls_version')
    .eq('job_id', jobId);

  const sessionList = sessions || [];
  const severityCounts = computeSeverityCounts(sessionList);
  const postureScore = computePostureScore(sessionList);
  const protocolBreakdown = computeProtocolBreakdown(sessionList);
  const tlsDist = computeTlsVersionDistribution(sessionList);

  const { data, error } = await supabase
    .from('analysis_jobs')
    .update({
      status: 'completed',
      progress: 100,
      completed_at: new Date().toISOString(),
      posture_score: postureScore,
      total_sessions: sessionList.length,
      severity_counts: severityCounts,
      protocol_breakdown: protocolBreakdown,
      tls_version_distribution: tlsDist,
      summary: {
        posture_score: postureScore,
        total_sessions: sessionList.length,
        severity_counts: severityCounts,
        protocol_breakdown: protocolBreakdown,
        tls_version_distribution: tlsDist,
      },
    })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function generateAndInsertSessions(
  jobId: string,
  scenario: SampleScenario,
  count: number
): Promise<void> {
  for (let i = 0; i < count; i++) {
    let actualScenario: 'good' | 'bad' | 'anomalous' | 'mixed';
    if (scenario === 'mixed') {
      const r = Math.random();
      actualScenario = r < 0.4 ? 'good' : r < 0.7 ? 'bad' : 'anomalous';
    } else {
      actualScenario = scenario;
    }

    const generated = generateSessionData(actualScenario);

    const { data: sessionRow, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        job_id: jobId,
        src_ip: generated.session.src_ip,
        dst_ip: generated.session.dst_ip,
        src_port: generated.session.src_port,
        dst_port: generated.session.dst_port,
        protocol: generated.session.protocol,
        tls_version: generated.session.tls_version,
        cipher_suite: generated.session.cipher_suite,
        key_exchange: generated.session.key_exchange,
        forward_secrecy: generated.session.forward_secrecy,
        starttls_upgraded: generated.session.starttls_upgraded,
        risk_level: generated.session.risk_level,
        anomaly_flag: generated.session.anomaly_flag,
        anomaly_score: generated.session.anomaly_score,
        risk_confidence: generated.session.risk_confidence,
        posture_score: generated.session.posture_score,
        features: generated.session.features,
        recommendations: generated.session.recommendations,
        client_hello: generated.session.client_hello,
        server_hello: generated.session.server_hello,
        tcp_timeline: generated.session.tcp_timeline,
      })
      .select()
      .single();

    if (sessionErr || !sessionRow) continue;

    const sessionId = sessionRow.id;

    if (generated.certificates.length > 0) {
      await supabase.from('certificates').insert(
        generated.certificates.map((c) => ({
          ...c,
          session_id: sessionId,
        }))
      );
    }

    if (generated.findings.length > 0) {
      await supabase.from('findings').insert(
        generated.findings.map((f) => ({
          ...f,
          session_id: sessionId,
        }))
      );
    }
  }
}

export async function getJob(jobId: string): Promise<AnalysisJob | null> {
  const { data, error } = await supabase
    .from('analysis_jobs')
    .select('*')
    .eq('id', jobId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getAllJobs(): Promise<AnalysisJob[]> {
  const { data, error } = await supabase
    .from('analysis_jobs')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const jobs = await getAllJobs();
  if (jobs.length === 0) {
    return {
      posture_score: 0,
      severity_counts: { critical: 0, high: 0, medium: 0, low: 0 },
      protocol_breakdown: {},
      tls_version_distribution: {},
      total_sessions: 0,
      total_jobs: 0,
      anomaly_count: 0,
      trend: [],
    };
  }

  const allSeverity: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  const allProtocol: Record<string, number> = {};
  const allTls: Record<string, number> = {};
  let totalSessions = 0;
  let anomalyCount = 0;

  for (const job of jobs) {
    const sc = job.severity_counts as unknown as SeverityCounts;
    if (sc) {
      allSeverity.critical += sc.critical || 0;
      allSeverity.high += sc.high || 0;
      allSeverity.medium += sc.medium || 0;
      allSeverity.low += sc.low || 0;
    }
    const pb = job.protocol_breakdown as Record<string, number>;
    if (pb) {
      for (const [k, v] of Object.entries(pb)) {
        allProtocol[k] = (allProtocol[k] || 0) + v;
      }
    }
    const tls = job.tls_version_distribution as Record<string, number>;
    if (tls) {
      for (const [k, v] of Object.entries(tls)) {
        allTls[k] = (allTls[k] || 0) + v;
      }
    }
    totalSessions += job.total_sessions || 0;
  }

  const { count } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('anomaly_flag', true);

  anomalyCount = count || 0;

  const overallPosture = computePostureScore(
    Object.entries(allSeverity).flatMap(([level, c]) =>
      Array(c).fill(0).map(() => ({ risk_level: level.toUpperCase() }))
    )
  );

  const trend = jobs.map((j) => ({
    job_id: j.id,
    filename: j.filename,
    posture_score: j.posture_score,
    created_at: j.created_at,
  }));

  return {
    posture_score: overallPosture,
    severity_counts: allSeverity,
    protocol_breakdown: allProtocol,
    tls_version_distribution: allTls,
    total_sessions: totalSessions,
    total_jobs: jobs.length,
    anomaly_count: anomalyCount,
    trend,
  };
}

export async function getSessions(
  filters: {
    jobId?: string;
    protocol?: string;
    riskLevel?: string;
    tlsVersion?: string;
    search?: string;
  } = {}
): Promise<Session[]> {
  let query = supabase.from('sessions').select('*');

  if (filters.jobId) query = query.eq('job_id', filters.jobId);
  if (filters.protocol && filters.protocol !== 'all') query = query.eq('protocol', filters.protocol);
  if (filters.riskLevel && filters.riskLevel !== 'all') query = query.eq('risk_level', filters.riskLevel);
  if (filters.tlsVersion && filters.tlsVersion !== 'all') query = query.eq('tls_version', filters.tlsVersion);
  if (filters.search) {
    query = query.or(`src_ip.ilike.%${filters.search}%,dst_ip.ilike.%${filters.search}%`);
  }

  query = query.order('risk_level', { ascending: false }).limit(500);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []) as unknown as Session[];
}

export async function getSessionById(id: string): Promise<Session | null> {
  const { data: session, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!session) return null;

  const { data: certs } = await supabase
    .from('certificates')
    .select('*')
    .eq('session_id', id)
    .order('chain_position', { ascending: true });

  const { data: findings } = await supabase
    .from('findings')
    .select('*')
    .eq('session_id', id)
    .order('severity', { ascending: false });

  return {
    ...session,
    certificates: (certs || []) as unknown as Certificate[],
    findings: (findings || []) as unknown as Finding[],
  } as unknown as Session;
}

export async function getAllCertificates(): Promise<Certificate[]> {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data || []) as unknown as Certificate[];
}

export async function getRecommendations(): Promise<
  { session_id: string; severity: string; title: string; description: string; recommendation: string; protocol: string; src_ip: string; dst_ip: string }[]
> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, protocol, src_ip, dst_ip, risk_level')
    .order('risk_level', { ascending: false })
    .limit(100);

  if (!sessions || sessions.length === 0) return [];

  const sessionIds = sessions.map((s) => s.id);
  const { data: findings } = await supabase
    .from('findings')
    .select('session_id, severity, title, description, recommendation')
    .in('session_id', sessionIds)
    .order('severity', { ascending: false });

  if (!findings) return [];

  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  return findings.map((f) => {
    const s = sessionMap.get(f.session_id);
    return {
      ...f,
      protocol: s?.protocol || '',
      src_ip: s?.src_ip || '',
      dst_ip: s?.dst_ip || '',
    };
  });
}

export async function deleteJob(jobId: string): Promise<void> {
  await supabase.from('analysis_jobs').delete().eq('id', jobId);
}

export async function seedSampleData(): Promise<void> {
  const jobs = await getAllJobs();
  if (jobs.length > 0) return;

  const samples: { filename: string; scenario: SampleScenario; count: number }[] = [
    { filename: 'gov_mail_smtp_2026.pcap', scenario: 'bad', count: 8 },
    { filename: 'defense_imap_tls13.pcap', scenario: 'good', count: 6 },
    { filename: 'embassy_pop3_mixed.pcap', scenario: 'mixed', count: 10 },
  ];

  for (const sample of samples) {
    const jobId = await createAnalysisJob({
      filename: sample.filename,
      scenario: sample.scenario,
      sessionCount: sample.count,
    });

    await updateJobProgress(jobId, 25);
    await generateAndInsertSessions(jobId, sample.scenario, sample.count);
    await updateJobProgress(jobId, 75);
    await completeAnalysisJob(jobId);
  }
}
