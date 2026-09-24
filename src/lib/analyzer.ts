import type {
  AnalysisJob,
  Certificate,
  Finding,
  Protocol,
  RiskLevel,
  Session,
  SessionFeatures,
  TcpTimelineEvent,
  ClientHello,
  ServerHello,
  Recommendation,
  SeverityCounts,
} from './types';

const TLS_VERSIONS = ['SSLv3', 'TLS 1.0', 'TLS 1.1', 'TLS 1.2', 'TLS 1.3'];
const TLS_VERSION_NUMS: Record<string, number> = {
  'SSLv3': 0x0300,
  'TLS 1.0': 0x0301,
  'TLS 1.1': 0x0302,
  'TLS 1.2': 0x0303,
  'TLS 1.3': 0x0304,
};

const STRONG_CIPHERS = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',
  'ECDHE-ECDSA-AES256-GCM-SHA384',
  'ECDHE-RSA-AES256-GCM-SHA384',
  'ECDHE-ECDSA-AES128-GCM-SHA256',
  'ECDHE-RSA-AES128-GCM-SHA256',
  'ECDHE-ECDSA-CHACHA20-POLY1305-SHA256',
];

const WEAK_CIPHERS = [
  'ECDHE-RSA-AES256-SHA',
  'AES256-SHA',
  'AES128-SHA',
  'ECDHE-RSA-AES128-SHA',
  'DES-CBC3-SHA',
  'RC4-MD5',
  'RC4-SHA',
  'EXP-RC4-MD5',
  'NULL-SHA',
];

const ALL_CIPHERS = [...STRONG_CIPHERS, ...WEAK_CIPHERS];

const TLS_EXTENSIONS = [
  'server_name (SNI)',
  'renegotiation_info',
  'supported_groups',
  'ec_point_formats',
  'session_ticket',
  'signature_algorithms',
  'supported_versions',
  'key_share',
  'psk_key_exchange_modes',
  'ALPN (h2, http/1.1)',
  'extended_master_secret',
  'padding',
];

const KEY_EXCHANGES = ['ECDHE', 'DHE', 'RSA'];
const KEY_EXCHANGE_SCORES: Record<string, number> = {
  'ECDHE': 10,
  'DHE': 8,
  'RSA': 3,
};

const SIG_ALGORITHMS = [
  'SHA256-RSA',
  'SHA384-RSA',
  'SHA256-ECDSA',
  'SHA1-RSA',
  'SHA1-ECDSA',
];
const SIG_ALGO_SCORES: Record<string, number> = {
  'SHA256-RSA': 9,
  'SHA384-RSA': 10,
  'SHA256-ECDSA': 9,
  'SHA1-RSA': 2,
  'SHA1-ECDSA': 2,
};

const CERT_SUBJECTS = [
  { subject: 'mail.gov.in', issuer: 'CA Government of India RSA Root CA' },
  { subject: 'smtp.nic.in', issuer: 'NIC CA Class 3 Certification Authority' },
  { subject: 'imap.egypt.gov', issuer: 'Egyptian Government Root CA' },
  { subject: 'mail.example.org', issuer: "Let's Encrypt R3" },
  { subject: 'pop3.corp.net', issuer: 'DigiCert Global Root CA' },
  { subject: 'smtp.university.edu', issuer: 'Sectigo RSA Organization Validation CA' },
  { subject: 'mail.research.lab', issuer: 'self-signed' },
  { subject: 'imap.defense.mil', issuer: 'DoD Root CA 3' },
  { subject: 'mail.treasury.gov', issuer: 'US Treasury Root CA' },
  { subject: 'smtp.embassy.gov', issuer: 'CA Government of India RSA Root CA' },
];

const PROTOCOLS: Protocol[] = ['SMTP', 'IMAP', 'POP3'];
const PROTOCOL_PORTS: Record<Protocol, number[]> = {
  SMTP: [25, 587, 465],
  IMAP: [143, 993],
  POP3: [110, 995],
};
const PROTOCOL_ENCODINGS: Record<Protocol, number> = {
  SMTP: 0,
  IMAP: 1,
  POP3: 2,
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomIp(): string {
  return `${10}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomServerIp(): string {
  const first = randomChoice([172, 192, 203, 13]);
  return `${first}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function randomSerial(): string {
  return randomHex(32).match(/.{2}/g)!.join(':').toUpperCase();
}

function randomFingerprint(): string {
  return randomHex(40).match(/.{2}/g)!.join(':').toUpperCase();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function cipherStrengthScore(cipher: string): number {
  if (cipher.startsWith('TLS_AES_256')) return 10;
  if (cipher.startsWith('TLS_AES_128') || cipher.includes('CHACHA20')) return 9;
  if (cipher.includes('GCM') && cipher.includes('ECDHE')) return 8;
  if (cipher.includes('GCM')) return 7;
  if (cipher.includes('SHA') && cipher.includes('ECDHE')) return 5;
  if (cipher.includes('3DES') || cipher.includes('CBC3')) return 2;
  if (cipher.includes('RC4')) return 1;
  if (cipher.includes('NULL') || cipher.includes('EXP')) return 0;
  return 4;
}

function pickWeighted<T>(items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export interface SessionTemplate {
  protocol: Protocol;
  tlsVersion: string;
  cipher: string;
  keyExchange: string;
  forwardSecrecy: boolean;
  starttls: boolean;
  certSubject: typeof CERT_SUBJECTS[0];
  certKeyLength: number;
  certSigAlgo: string;
  certDaysToExpiry: number;
  certSelfSigned: boolean;
  anomaly: boolean;
  anomalyScore: number;
  riskConfidence: number;
}

export function generateSessionTemplate(
  scenario: 'good' | 'bad' | 'anomalous' | 'mixed'
): SessionTemplate {
  if (scenario === 'good') {
    const subj = randomChoice(CERT_SUBJECTS.filter((s) => s.issuer !== 'self-signed'));
    return {
      protocol: randomChoice(PROTOCOLS),
      tlsVersion: pickWeighted(['TLS 1.3', 'TLS 1.2'], [7, 3]),
      cipher: randomChoice(STRONG_CIPHERS.slice(0, 5)),
      keyExchange: 'ECDHE',
      forwardSecrecy: true,
      starttls: Math.random() > 0.3,
      certSubject: subj,
      certKeyLength: randomChoice([2048, 3072, 4096]),
      certSigAlgo: randomChoice(['SHA256-RSA', 'SHA384-RSA', 'SHA256-ECDSA']),
      certDaysToExpiry: Math.floor(Math.random() * 300) + 60,
      certSelfSigned: false,
      anomaly: false,
      anomalyScore: Math.random() * 0.15,
      riskConfidence: 0.85 + Math.random() * 0.14,
    };
  }

  if (scenario === 'bad') {
    return {
      protocol: randomChoice(PROTOCOLS),
      tlsVersion: pickWeighted(['SSLv3', 'TLS 1.0', 'TLS 1.1'], [2, 5, 3]),
      cipher: randomChoice(WEAK_CIPHERS),
      keyExchange: 'RSA',
      forwardSecrecy: false,
      starttls: Math.random() > 0.5,
      certSubject: randomChoice(CERT_SUBJECTS),
      certKeyLength: randomChoice([1024, 1024, 2048]),
      certSigAlgo: randomChoice(['SHA1-RSA', 'SHA1-ECDSA', 'SHA256-RSA']),
      certDaysToExpiry: Math.floor(Math.random() * 60) - 30,
      certSelfSigned: Math.random() > 0.5,
      anomaly: false,
      anomalyScore: Math.random() * 0.3,
      riskConfidence: 0.78 + Math.random() * 0.2,
    };
  }

  if (scenario === 'anomalous') {
    return {
      protocol: randomChoice(PROTOCOLS),
      tlsVersion: randomChoice(['TLS 1.0', 'TLS 1.2']),
      cipher: randomChoice([...WEAK_CIPHERS.slice(0, 3), ...STRONG_CIPHERS.slice(5)]),
      keyExchange: randomChoice(['RSA', 'DHE']),
      forwardSecrecy: Math.random() > 0.5,
      starttls: Math.random() > 0.5,
      certSubject: randomChoice(CERT_SUBJECTS),
      certKeyLength: randomChoice([1024, 2048]),
      certSigAlgo: randomChoice(['SHA1-RSA', 'SHA256-RSA']),
      certDaysToExpiry: Math.floor(Math.random() * 200) + 10,
      certSelfSigned: Math.random() > 0.6,
      anomaly: true,
      anomalyScore: 0.65 + Math.random() * 0.3,
      riskConfidence: 0.7 + Math.random() * 0.25,
    };
  }

  return generateSessionTemplate(randomChoice(['good', 'bad', 'anomalous', 'good', 'bad']) as 'good' | 'bad' | 'anomalous');
}

function computeRiskScore(features: SessionFeatures): RiskLevel {
  let score = 0;
  if (features.tls_version_num <= 0x0301) score += 30;
  else if (features.tls_version_num === 0x0302) score += 20;
  else if (features.tls_version_num === 0x0303 && features.forward_secrecy === 0) score += 10;

  if (features.cipher_strength_score < 3) score += 20;
  else if (features.cipher_strength_score < 5) score += 10;

  if (features.key_exchange_score < 5) score += 15;

  if (features.forward_secrecy === 0) score += 10;

  if (features.cert_valid === 0) score += 15;

  if (features.cert_days_to_expiry < 30 && features.cert_days_to_expiry >= 0) score += 10;
  if (features.cert_days_to_expiry < 0) score += 15;

  if (score >= 60) return 'CRITICAL';
  if (score >= 40) return 'HIGH';
  if (score >= 20) return 'MEDIUM';
  return 'LOW';
}

function buildTcpTimeline(
  protocol: Protocol,
  starttls: boolean,
  baseTime: Date
): TcpTimelineEvent[] {
  const events: TcpTimelineEvent[] = [];
  let t = baseTime.getTime();

  const push = (
    direction: 'client' | 'server',
    event: string,
    detail: string,
    phase: 'plaintext' | 'starttls' | 'tls'
  ) => {
    t += Math.floor(Math.random() * 50) + 5;
    events.push({
      timestamp: new Date(t).toISOString(),
      direction,
      event,
      detail,
      phase,
    });
  };

  if (protocol === 'SMTP') {
    push('server', '220 Banner', '220 mail.gov.in ESMTP Postfix', 'plaintext');
    push('client', 'EHLO', 'EHLO client.local', 'plaintext');
    push('server', '250 Capabilities', '250-PIPELINING 250-STARTTLS 250-AUTH', 'plaintext');
    if (starttls) {
      push('client', 'STARTTLS', 'STARTTLS', 'starttls');
      push('server', '220 Ready', '220 Ready to start TLS', 'starttls');
    }
  } else if (protocol === 'IMAP') {
    push('server', '* OK Banner', '* OK [CAPABILITY IMAP4rev1 STARTTLS AUTH=PLAIN]', 'plaintext');
    push('client', 'CAPABILITY', 'A001 CAPABILITY', 'plaintext');
    push('server', '* CAPABILITY', '* CAPABILITY IMAP4rev1 STARTTLS LOGINDISABLED', 'plaintext');
    if (starttls) {
      push('client', 'STARTTLS', 'A002 STARTTLS', 'starttls');
      push('server', '* OK', 'A002 OK Begin TLS negotiation', 'starttls');
    }
  } else {
    push('server', '+OK Banner', '+OK POP3 server ready', 'plaintext');
    push('client', 'CAPA', 'CAPA', 'plaintext');
    push('server', '+OK Capabilities', 'SASL PLAIN STLS', 'plaintext');
    if (starttls) {
      push('client', 'STLS', 'STLS', 'starttls');
      push('server', '+OK', '+OK Begin TLS negotiation', 'starttls');
    }
  }

  push('client', 'ClientHello', `TLS ${randomChoice(TLS_VERSIONS)} handshake`, 'tls');
  push('server', 'ServerHello', `Negotiated cipher suite`, 'tls');
  push('server', 'Certificate', 'X.509 certificate chain', 'tls');
  push('client', 'ClientKeyExchange', 'Key exchange parameters', 'tls');
  push('server', 'ServerFinished', 'ChangeCipherSpec + Finished', 'tls');
  push('client', 'ClientFinished', 'ChangeCipherSpec + Finished', 'tls');

  return events;
}

function buildClientHello(tlsVersion: string): ClientHello {
  const cipherCount = Math.floor(Math.random() * 15) + 5;
  const ciphers: string[] = [];
  for (let i = 0; i < cipherCount; i++) {
    ciphers.push(randomChoice(ALL_CIPHERS));
  }
  const extCount = Math.floor(Math.random() * 6) + 3;
  const extensions: string[] = [];
  for (let i = 0; i < extCount; i++) {
    const ext = randomChoice(TLS_EXTENSIONS);
    if (!extensions.includes(ext)) extensions.push(ext);
  }
  return {
    tls_version: tlsVersion,
    cipher_suites: ciphers,
    extensions,
    sni: randomChoice(CERT_SUBJECTS).subject,
    session_id: randomHex(64),
  };
}

function buildServerHello(tlsVersion: string, cipher: string, keyExchange: string): ServerHello {
  const extCount = Math.floor(Math.random() * 4) + 2;
  const extensions: string[] = [];
  for (let i = 0; i < extCount; i++) {
    const ext = randomChoice(TLS_EXTENSIONS);
    if (!extensions.includes(ext)) extensions.push(ext);
  }
  return {
    tls_version: tlsVersion,
    selected_cipher: cipher,
    key_exchange: keyExchange,
    extensions,
    session_id: randomHex(64),
  };
}

function buildCertificates(
  sessionId: string,
  template: SessionTemplate
): Certificate[] {
  const certs: Certificate[] = [];
  const now = new Date();
  const notBeforeDays = template.certDaysToExpiry > 0 ? 365 : 400;
  const notBefore = new Date(now.getTime() - notBeforeDays * 86400000);
  const notAfter = new Date(now.getTime() + template.certDaysToExpiry * 86400000);

  const leafCert: Certificate = {
    id: crypto.randomUUID(),
    session_id: sessionId,
    subject: template.certSubject.subject,
    issuer: template.certSelfSigned ? template.certSubject.subject : template.certSubject.issuer,
    serial_number: randomSerial(),
    not_before: notBefore.toISOString(),
    not_after: notAfter.toISOString(),
    key_algorithm: template.certKeyLength >= 256 ? 'ECDSA' : 'RSA',
    key_length: template.certKeyLength,
    signature_algorithm: template.certSigAlgo,
    san_entries: [template.certSubject.subject, `*.${template.certSubject.subject.split('.').slice(1).join('.')}`],
    fingerprint: randomFingerprint(),
    is_valid: template.certDaysToExpiry > 0 && !template.certSelfSigned,
    is_self_signed: template.certSelfSigned,
    is_expired: template.certDaysToExpiry < 0,
    days_to_expiry: template.certDaysToExpiry,
    chain_position: 'leaf',
    created_at: now.toISOString(),
  };
  certs.push(leafCert);

  if (!template.certSelfSigned) {
    certs.push({
      id: crypto.randomUUID(),
      session_id: sessionId,
      subject: template.certSubject.issuer,
      issuer: 'Global Root CA',
      serial_number: randomSerial(),
      not_before: new Date(now.getTime() - 730 * 86400000).toISOString(),
      not_after: new Date(now.getTime() + 365 * 86400000).toISOString(),
      key_algorithm: 'RSA',
      key_length: 4096,
      signature_algorithm: 'SHA384-RSA',
      san_entries: [],
      fingerprint: randomFingerprint(),
      is_valid: true,
      is_self_signed: false,
      is_expired: false,
      days_to_expiry: 365,
      chain_position: 'intermediate',
      created_at: now.toISOString(),
    });

    certs.push({
      id: crypto.randomUUID(),
      session_id: sessionId,
      subject: 'Global Root CA',
      issuer: 'Global Root CA',
      serial_number: randomSerial(),
      not_before: new Date(now.getTime() - 1460 * 86400000).toISOString(),
      not_after: new Date(now.getTime() + 730 * 86400000).toISOString(),
      key_algorithm: 'RSA',
      key_length: 4096,
      signature_algorithm: 'SHA384-RSA',
      san_entries: [],
      fingerprint: randomFingerprint(),
      is_valid: true,
      is_self_signed: true,
      is_expired: false,
      days_to_expiry: 730,
      chain_position: 'root',
      created_at: now.toISOString(),
    });
  }

  return certs;
}

function generateFindings(template: SessionTemplate): Finding[] {
  const findings: Omit<Finding, 'id' | 'session_id' | 'created_at'>[] = [];

  const tlsNum = TLS_VERSION_NUMS[template.tlsVersion] ?? 0x0303;

  if (tlsNum <= 0x0301) {
    findings.push({
      severity: 'CRITICAL',
      category: 'TLS Version',
      title: `Deprecated TLS version: ${template.tlsVersion}`,
      description: `${template.tlsVersion} is deprecated and vulnerable to known attacks (POODLE, BEAST). It does not meet modern security standards.`,
      recommendation: 'Disable TLS 1.0/1.1 and SSLv3. Enforce TLS 1.2+ minimum (RFC 8996).',
    });
  } else if (tlsNum === 0x0302) {
    findings.push({
      severity: 'HIGH',
      category: 'TLS Version',
      title: `Deprecated TLS version: ${template.tlsVersion}`,
      description: `${template.tlsVersion} is deprecated and does not meet current security requirements.`,
      recommendation: 'Disable TLS 1.1. Enforce TLS 1.2+ minimum (RFC 8996).',
    });
  }

  if (template.cipher.includes('RC4')) {
    findings.push({
      severity: 'CRITICAL',
      category: 'Weak Cipher',
      title: 'RC4 cipher suite detected',
      description: 'RC4 is a broken stream cipher with known cryptographic weaknesses. It is prohibited by RFC 7465.',
      recommendation: 'Disable RC4. Use AES-GCM or ChaCha20-Poly1305 cipher suites.',
    });
  }
  if (template.cipher.includes('3DES') || template.cipher.includes('CBC3')) {
    findings.push({
      severity: 'CRITICAL',
      category: 'Weak Cipher',
      title: '3DES cipher suite detected',
      description: '3DES has a 64-bit block size vulnerable to birthday attacks (Sweet32). Prohibited by RFC 8996.',
      recommendation: 'Disable 3DES. Use AES-128 or AES-256 GCM mode cipher suites.',
    });
  }
  if (template.cipher.includes('NULL') || template.cipher.includes('EXP')) {
    findings.push({
      severity: 'CRITICAL',
      category: 'Weak Cipher',
      title: 'NULL or EXPORT cipher suite detected',
      description: 'NULL/EXPORT cipher suites provide no encryption or use dangerously weak keys.',
      recommendation: 'Remove all NULL and EXPORT cipher suites immediately.',
    });
  }

  if (!template.forwardSecrecy && template.keyExchange === 'RSA') {
    findings.push({
      severity: 'MEDIUM',
      category: 'Forward Secrecy',
      title: 'No Perfect Forward Secrecy',
      description: 'RSA key exchange does not provide forward secrecy. Compromise of the private key decrypts all past traffic.',
      recommendation: 'Enable ECDHE key exchange for Perfect Forward Secrecy.',
    });
  }

  if (template.certKeyLength < 2048 && template.certKeyLength > 0) {
    findings.push({
      severity: 'HIGH',
      category: 'Certificate',
      title: `Weak certificate key: ${template.certKeyLength} bits`,
      description: `RSA key length of ${template.certKeyLength} bits is below the 2048-bit minimum. Vulnerable to factorization attacks.`,
      recommendation: 'Reissue certificate with at least 2048-bit RSA or 256-bit ECDSA keys.',
    });
  }

  if (template.certSigAlgo.startsWith('SHA1')) {
    findings.push({
      severity: 'HIGH',
      category: 'Certificate',
      title: 'SHA-1 signature algorithm',
      description: 'SHA-1 is cryptographically broken for collision resistance. Certificates using SHA-1 are distrusted by modern browsers.',
      recommendation: 'Reissue certificate with SHA-256 or SHA-384 signature algorithm.',
    });
  }

  if (template.certDaysToExpiry < 0) {
    findings.push({
      severity: 'CRITICAL',
      category: 'Certificate',
      title: 'Expired certificate',
      description: `Certificate expired ${Math.abs(template.certDaysToExpiry)} days ago. Expired certificates are not trusted by any client.`,
      recommendation: 'Renew the certificate immediately and deploy the new certificate chain.',
    });
  } else if (template.certDaysToExpiry < 30) {
    findings.push({
      severity: 'MEDIUM',
      category: 'Certificate',
      title: 'Certificate expiring soon',
      description: `Certificate expires in ${template.certDaysToExpiry} days. Clients will reject connections after expiry.`,
      recommendation: 'Initiate certificate renewal process immediately.',
    });
  }

  if (template.certSelfSigned) {
    findings.push({
      severity: 'MEDIUM',
      category: 'Certificate',
      title: 'Self-signed certificate',
      description: 'Self-signed certificates are not trusted by clients unless manually installed. They break TLS verification.',
      recommendation: 'Obtain a certificate from a trusted Certificate Authority.',
    });
  }

  if (template.anomaly) {
    findings.push({
      severity: 'HIGH',
      category: 'Anomaly',
      title: 'Anomalous TLS session detected by ML',
      description: `Isolation Forest anomaly score: ${template.anomalyScore.toFixed(2)}. Session exhibits unusual cipher/TLS parameter combinations.`,
      recommendation: 'Investigate this session. Check for MITM tools, misconfigured servers, or downgrade attacks.',
    });
  }

  if (!template.starttls && template.protocol !== 'SMTP') {
    findings.push({
      severity: 'MEDIUM',
      category: 'STARTTLS',
      title: 'STARTTLS not used',
      description: 'Session did not negotiate STARTTLS. Communication may have been in plaintext.',
      recommendation: 'Configure server to require STARTTLS, not opportunistic TLS.',
    });
  }

  return findings.map((f) => ({
    ...f,
    id: crypto.randomUUID(),
    session_id: '',
    created_at: new Date().toISOString(),
  }));
}

function buildRecommendations(findings: Finding[]): Recommendation[] {
  return findings.map((f) => ({
    severity: f.severity,
    title: f.title,
    description: f.description,
    recommendation: f.recommendation,
  }));
}

export interface GeneratedSession {
  session: Omit<Session, 'id' | 'job_id' | 'created_at' | 'certificates' | 'findings'>;
  certificates: Omit<Certificate, 'id' | 'session_id' | 'created_at'>[];
  findings: Omit<Finding, 'id' | 'session_id' | 'created_at'>[];
}

export function generateSessionData(
  scenario: 'good' | 'bad' | 'anomalous' | 'mixed'
): GeneratedSession {
  const template = generateSessionTemplate(scenario);
  const sessionId = crypto.randomUUID();
  const now = new Date();

  const tlsNum = TLS_VERSION_NUMS[template.tlsVersion] ?? 0x0303;
  const cipherScore = cipherStrengthScore(template.cipher);
  const kxScore = KEY_EXCHANGE_SCORES[template.keyExchange] ?? 3;
  const sigScore = SIG_ALGO_SCORES[template.certSigAlgo] ?? 5;

  const features: SessionFeatures = {
    tls_version_num: tlsNum,
    cipher_strength_score: cipherScore,
    key_exchange_score: kxScore,
    forward_secrecy: template.forwardSecrecy ? 1 : 0,
    cert_valid: template.certDaysToExpiry > 0 && !template.certSelfSigned ? 1 : 0,
    cert_days_to_expiry: template.certDaysToExpiry,
    cert_key_length: template.certKeyLength,
    cert_sig_algo_score: sigScore,
    cert_chain_valid: !template.certSelfSigned ? 1 : 0,
    cert_self_signed: template.certSelfSigned ? 1 : 0,
    starttls_correct: template.starttls ? 1 : 0,
    cipher_suite_count: Math.floor(Math.random() * 15) + 5,
    extension_count: Math.floor(Math.random() * 6) + 3,
    protocol_type_encoded: PROTOCOL_ENCODINGS[template.protocol],
  };

  const riskLevel = computeRiskScore(features);
  const clientHello = buildClientHello(template.tlsVersion);
  const serverHello = buildServerHello(template.tlsVersion, template.cipher, template.keyExchange);
  const tcpTimeline = buildTcpTimeline(template.protocol, template.starttls, now);
  const certificates = buildCertificates(sessionId, template);
  const findings = generateFindings(template);
  const recommendations = buildRecommendations(findings);

  const postureScore = Math.max(
    0,
    100 -
      (riskLevel === 'CRITICAL' ? 40 : riskLevel === 'HIGH' ? 25 : riskLevel === 'MEDIUM' ? 12 : 3) -
      (template.anomaly ? 10 : 0)
  );

  const session: Omit<Session, 'id' | 'job_id' | 'created_at' | 'certificates' | 'findings'> = {
    src_ip: randomIp(),
    dst_ip: randomServerIp(),
    src_port: Math.floor(Math.random() * 50000) + 10000,
    dst_port: randomChoice(PROTOCOL_PORTS[template.protocol]),
    protocol: template.protocol,
    tls_version: template.tlsVersion,
    cipher_suite: template.cipher,
    key_exchange: template.keyExchange,
    forward_secrecy: template.forwardSecrecy,
    starttls_upgraded: template.starttls,
    risk_level: riskLevel,
    anomaly_flag: template.anomaly,
    anomaly_score: template.anomalyScore,
    risk_confidence: template.riskConfidence,
    posture_score: postureScore,
    features,
    recommendations,
    client_hello: clientHello,
    server_hello: serverHello,
    tcp_timeline: tcpTimeline,
  };

  return {
    session,
    certificates: certificates.map((c) => ({
      subject: c.subject,
      issuer: c.issuer,
      serial_number: c.serial_number,
      not_before: c.not_before,
      not_after: c.not_after,
      key_algorithm: c.key_algorithm,
      key_length: c.key_length,
      signature_algorithm: c.signature_algorithm,
      san_entries: c.san_entries,
      fingerprint: c.fingerprint,
      is_valid: c.is_valid,
      is_self_signed: c.is_self_signed,
      is_expired: c.is_expired,
      days_to_expiry: c.days_to_expiry,
      chain_position: c.chain_position,
    })),
    findings: findings.map((f) => ({
      severity: f.severity,
      category: f.category,
      title: f.title,
      description: f.description,
      recommendation: f.recommendation,
    })),
  };
}

export function computeSeverityCounts(sessions: { risk_level: string }[]): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const s of sessions) {
    const level = s.risk_level.toLowerCase() as keyof SeverityCounts;
    if (level in counts) counts[level]++;
  }
  return counts;
}

export function computePostureScore(sessions: { risk_level: string }[]): number {
  if (sessions.length === 0) return 100;
  const counts = computeSeverityCounts(sessions);
  const score = 100 - Math.round(
    (counts.critical * 25 + counts.high * 10 + counts.medium * 4 + counts.low * 1) / sessions.length
  );
  return Math.max(0, Math.min(100, score));
}

export function computeProtocolBreakdown(sessions: { protocol: string }[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  for (const s of sessions) {
    breakdown[s.protocol] = (breakdown[s.protocol] || 0) + 1;
  }
  return breakdown;
}

export function computeTlsVersionDistribution(sessions: { tls_version: string }[]): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const s of sessions) {
    const v = s.tls_version || 'Unknown';
    dist[v] = (dist[v] || 0) + 1;
  }
  return dist;
}

export const SAMPLE_SCENARIOS = ['good', 'bad', 'anomalous', 'mixed'] as const;
export type SampleScenario = typeof SAMPLE_SCENARIOS[number];
