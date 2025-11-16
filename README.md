# CloudCut - AWS Cost Optimization Tool

CloudCut is a web application that connects to AWS accounts (read-only), analyzes cloud resources for waste, and generates actionable Terraform code to eliminate unnecessary costs.

## Core Value Proposition

**Connect your AWS account → Get a cost optimization report in 2 minutes → Download Terraform to fix issues → Save 20-40% on cloud costs**

## Features Implemented

### AWS Integration
- Read-only IAM role assumption via STS
- Secure temporary credentials (1-hour expiration)
- Multi-region support

### Resource Scanning
- **Idle EC2 instances** - CPU <5% for 7 days
- **Idle RDS databases** - Zero connections for 7 days
- **Unattached EBS volumes** - Not connected to any instance
- **Unallocated Elastic IPs** - Reserved but not in use
- **Oversized instances** - CPU <20% (downsizing recommendations)

### Cost Analysis
- Comprehensive AWS pricing reference (hardcoded for MVP)
- Monthly cost calculations
- Potential savings identification
- Savings percentage tracking

### Terraform Generation
- Auto-generated Terraform code for each finding
- Safe deletion with backup recommendations
- Complete .tf file download with README
- Region-specific configurations

### Authentication & Security
- NextAuth.js with email/password
- Secure password hashing (bcrypt)
- Session-based JWT authentication
- Read-only AWS access only

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Lucide React
- **Backend**: Next.js API routes, AWS SDK v3, Prisma ORM
- **Database**: PostgreSQL
- **Auth**: NextAuth.js
- **Deployment**: Vercel (recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cloudcut"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
AWS_ACCOUNT_ID="your-aws-account-id"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 3. Set Up Database

```bash
# Note: Prisma init may fail due to engine download issues in some environments
# The schema is already created in prisma/schema.prisma

# When database is available, run:
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
cloud-cut/
├── app/
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── aws/           # AWS account management
│   │   └── scans/         # Scanning and results
│   ├── page.tsx           # Landing page
│   └── globals.css        # Styles
├── lib/
│   ├── scanners/          # Resource scanners (EC2, RDS, EBS, EIP)
│   ├── aws-helpers.ts     # AWS SDK utilities
│   ├── aws-pricing.ts     # Pricing calculations
│   ├── scan-orchestrator.ts   # Main scan logic
│   └── terraform-generator.ts # Terraform code generation
├── components/ui/         # shadcn/ui components
└── prisma/schema.prisma   # Database schema
```

## AWS Setup for End Users

Users need to create an IAM role in their AWS account:

1. Go to IAM Console → Roles → Create Role
2. Select "Another AWS account"
3. Enter CloudCut's AWS account ID
4. Attach `ReadOnlyAccess` policy
5. Copy the Role ARN and paste in CloudCut

## API Endpoints

- `POST /api/auth/signup` - Create account
- `POST /api/aws/connect` - Connect AWS account
- `GET /api/aws/accounts` - List AWS accounts
- `POST /api/scans/start` - Start scan
- `GET /api/scans/[id]` - Get results
- `GET /api/scans/[id]/terraform` - Download Terraform

## Security Features

- Read-only AWS access
- No credentials stored (only Role ARN)
- Temporary STS credentials (1-hour expiry)
- User reviews all Terraform before applying
- Password hashing with bcrypt

## Deployment to Vercel

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy

## Current Status & Next Steps

### ✅ Completed
- Core backend infrastructure
- All AWS scanners (EC2, RDS, EBS, EIP)
- Terraform generation
- API endpoints
- Landing page
- Database schema
- Authentication system

### 🚧 To Do
- Login/Signup frontend pages
- Dashboard (overview, account list)
- Scan results page with visualizations
- Charts with Recharts
- Account management UI
- Testing and bug fixes

## License

MIT

---

Built to help you save money on AWS infrastructure.
