/*
# SecureMailScope Database Schema

1. Purpose
- Stores PCAP analysis jobs, reconstructed email sessions, TLS certificates,
  security findings, and ML-based risk assessments for the SecureMailScope
  network forensic tool (SIH26159).

2. New Tables
- `analysis_jobs` — metadata for each uploaded/analyzed PCAP file
  - id (uuid, PK), filename, status, progress, created_at, completed_at,
    posture_score, total_sessions, severity_counts (jsonb), protocol_breakdown (jsonb),
    tls_version_distribution (jsonb), summary (jsonb)
- `sessions` — individual email sessions reconstructed from PCAP
  - id (uuid, PK), job_id (FK → analysis_jobs), src_ip, dst_ip, src_port, dst_port,
    protocol, tls_version, cipher_suite, key_exchange, forward_secrecy, starttls_upgraded,
    risk_level, anomaly_flag, anomaly_score, risk_confidence, posture_score,
    features (jsonb), recommendations (jsonb), client_hello (jsonb), server_hello (jsonb),
    tcp_timeline (jsonb), created_at
- `certificates` — X.509 certificates extracted from TLS handshakes
  - id (uuid, PK), session_id (FK → sessions), subject, issuer, serial_number,
    not_before, not_after, key_algorithm, key_length, signature_algorithm,
    san_entries (text[]), fingerprint, is_valid, is_self_signed, is_expired,
    days_to_expiry, chain_position, created_at
- `findings` — security findings/weaknesses detected per session
  - id (uuid, PK), session_id (FK → sessions), severity, category, title, description,
    recommendation, created_at

3. Security
- Single-tenant app (no auth). RLS enabled on all tables.
- anon + authenticated roles have full CRUD — data is intentionally shared/public
  for this forensic analysis tool.

4. Indexes
- sessions.job_id, certificates.session_id, findings.session_id for join performance.
- sessions.risk_level, sessions.protocol for filter performance.
*/

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  progress int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  posture_score int DEFAULT 0,
  total_sessions int DEFAULT 0,
  severity_counts jsonb DEFAULT '{}'::jsonb,
  protocol_breakdown jsonb DEFAULT '{}'::jsonb,
  tls_version_distribution jsonb DEFAULT '{}'::jsonb,
  summary jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_analysis_jobs" ON analysis_jobs;
CREATE POLICY "anon_select_analysis_jobs" ON analysis_jobs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_analysis_jobs" ON analysis_jobs;
CREATE POLICY "anon_insert_analysis_jobs" ON analysis_jobs FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_analysis_jobs" ON analysis_jobs;
CREATE POLICY "anon_update_analysis_jobs" ON analysis_jobs FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_analysis_jobs" ON analysis_jobs;
CREATE POLICY "anon_delete_analysis_jobs" ON analysis_jobs FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES analysis_jobs(id) ON DELETE CASCADE,
  src_ip text NOT NULL,
  dst_ip text NOT NULL,
  src_port int NOT NULL,
  dst_port int NOT NULL,
  protocol text NOT NULL,
  tls_version text,
  cipher_suite text,
  key_exchange text,
  forward_secrecy boolean DEFAULT false,
  starttls_upgraded boolean DEFAULT false,
  risk_level text NOT NULL DEFAULT 'LOW',
  anomaly_flag boolean DEFAULT false,
  anomaly_score float DEFAULT 0,
  risk_confidence float DEFAULT 0,
  posture_score int DEFAULT 0,
  features jsonb DEFAULT '{}'::jsonb,
  recommendations jsonb DEFAULT '[]'::jsonb,
  client_hello jsonb DEFAULT '{}'::jsonb,
  server_hello jsonb DEFAULT '{}'::jsonb,
  tcp_timeline jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  subject text NOT NULL,
  issuer text NOT NULL,
  serial_number text,
  not_before timestamptz,
  not_after timestamptz,
  key_algorithm text,
  key_length int,
  signature_algorithm text,
  san_entries text[] DEFAULT '{}',
  fingerprint text,
  is_valid boolean DEFAULT true,
  is_self_signed boolean DEFAULT false,
  is_expired boolean DEFAULT false,
  days_to_expiry int,
  chain_position text DEFAULT 'leaf',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_certificates" ON certificates;
CREATE POLICY "anon_select_certificates" ON certificates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_certificates" ON certificates;
CREATE POLICY "anon_insert_certificates" ON certificates FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_certificates" ON certificates;
CREATE POLICY "anon_update_certificates" ON certificates FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_certificates" ON certificates;
CREATE POLICY "anon_delete_certificates" ON certificates FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  severity text NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  recommendation text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE findings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_findings" ON findings;
CREATE POLICY "anon_select_findings" ON findings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_findings" ON findings;
CREATE POLICY "anon_insert_findings" ON findings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_findings" ON findings;
CREATE POLICY "anon_update_findings" ON findings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_findings" ON findings;
CREATE POLICY "anon_delete_findings" ON findings FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sessions_job_id ON sessions(job_id);
CREATE INDEX IF NOT EXISTS idx_sessions_risk_level ON sessions(risk_level);
CREATE INDEX IF NOT EXISTS idx_sessions_protocol ON sessions(protocol);
CREATE INDEX IF NOT EXISTS idx_certificates_session_id ON certificates(session_id);
CREATE INDEX IF NOT EXISTS idx_findings_session_id ON findings(session_id);
