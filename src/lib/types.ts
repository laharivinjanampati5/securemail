export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Protocol = 'SMTP' | 'IMAP' | 'POP3';
export type JobStatus = 'pending' | 'analyzing' | 'completed' | 'failed';

export interface AnalysisJob {
  id: string;
  filename: string;
  status: JobStatus;
  progress: number;
  created_at: string;
  completed_at: string | null;
  posture_score: number;
  total_sessions: number;
  severity_counts: SeverityCounts;
  protocol_breakdown: Record<string, number>;
  tls_version_distribution: Record<string, number>;
  summary: Record<string, unknown>;
}

export interface SeverityCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface TcpTimelineEvent {
  timestamp: string;
  direction: 'client' | 'server';
  event: string;
  detail: string;
  phase: 'plaintext' | 'starttls' | 'tls';
}

export interface ClientHello {
  tls_version: string;
  cipher_suites: string[];
  extensions: string[];
  sni: string;
  session_id: string;
}

export interface ServerHello {
  tls_version: string;
  selected_cipher: string;
  key_exchange: string;
  extensions: string[];
  session_id: string;
}

export interface SessionFeatures {
  tls_version_num: number;
  cipher_strength_score: number;
  key_exchange_score: number;
  forward_secrecy: number;
  cert_valid: number;
  cert_days_to_expiry: number;
  cert_key_length: number;
  cert_sig_algo_score: number;
  cert_chain_valid: number;
  cert_self_signed: number;
  starttls_correct: number;
  cipher_suite_count: number;
  extension_count: number;
  protocol_type_encoded: number;
}

export interface Recommendation {
  severity: RiskLevel;
  title: string;
  description: string;
  recommendation: string;
}

export interface Session {
  id: string;
  job_id: string;
  src_ip: string;
  dst_ip: string;
  src_port: number;
  dst_port: number;
  protocol: Protocol;
  tls_version: string;
  cipher_suite: string;
  key_exchange: string;
  forward_secrecy: boolean;
  starttls_upgraded: boolean;
  risk_level: RiskLevel;
  anomaly_flag: boolean;
  anomaly_score: number;
  risk_confidence: number;
  posture_score: number;
  features: SessionFeatures;
  recommendations: Recommendation[];
  client_hello: ClientHello;
  server_hello: ServerHello;
  tcp_timeline: TcpTimelineEvent[];
  created_at: string;
  certificates?: Certificate[];
  findings?: Finding[];
}

export interface Certificate {
  id: string;
  session_id: string;
  subject: string;
  issuer: string;
  serial_number: string;
  not_before: string;
  not_after: string;
  key_algorithm: string;
  key_length: number;
  signature_algorithm: string;
  san_entries: string[];
  fingerprint: string;
  is_valid: boolean;
  is_self_signed: boolean;
  is_expired: boolean;
  days_to_expiry: number;
  chain_position: 'leaf' | 'intermediate' | 'root';
  created_at: string;
}

export interface Finding {
  id: string;
  session_id: string;
  severity: RiskLevel;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  created_at: string;
}

export interface DashboardStats {
  posture_score: number;
  severity_counts: SeverityCounts;
  protocol_breakdown: Record<string, number>;
  tls_version_distribution: Record<string, number>;
  total_sessions: number;
  total_jobs: number;
  anomaly_count: number;
  trend: { job_id: string; filename: string; posture_score: number; created_at: string }[];
}
