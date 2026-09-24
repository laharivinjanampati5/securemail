# SecureMailScope — AI-Assisted Email Security Posture Assessment

SecureMailScope is an intelligent email security posture assessment platform designed to help organizations evaluate, diagnose, and strengthen their email domain security configurations (SPF, DKIM, DMARC, BIMI, MX records, and AI-driven posture scoring).

## Features

- **Domain Security Assessment**: Comprehensive validation of SPF, DKIM, DMARC, MX, and BIMI records.
- **AI-Assisted Posture Scoring**: Detailed scoring breakdowns with security gap identification.
- **Step-by-Step Remediation**: Guided instructions to configure DNS records and achieve strong security policies.
- **Interactive Security Dashboard**: Real-time analytics, status badges, and exportable reports.
- **Supabase Integration**: Secure persistent storage and authentication.

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Icons & Charts**: Lucide React, Recharts
- **Backend / Database**: Supabase
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd securemail
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
   Add your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## License

MIT
