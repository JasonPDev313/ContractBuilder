# FormBuilder - Contract Management System

A modern contract management system built with Next.js 16, TypeScript, Prisma, and Supabase. Create, send, and manage e-signature contracts like a simplified DocuSign.

## Tech Stack

- **Next.js 16** - React framework with App Router and Server Actions
- **TypeScript** - Type-safe development
- **Prisma** - Type-safe ORM
- **Supabase** - PostgreSQL database
- **NextAuth.js** - Authentication
- **Resend** - Email delivery
- **Tailwind CSS** - Styling
- **Zod** - Schema validation

## Setup Status

✅ Next.js application created
✅ All dependencies installed
✅ Prisma schema configured
✅ Authentication setup (NextAuth.js)
✅ Server actions created
✅ Email service configured
✅ TypeScript types defined
✅ VS Code workspace configured

⚠️ **Action Required:** Configure environment variables and run database migration

## Next Steps

### 1. Configure Environment Variables

Open [.env](.env) and update it with your actual credentials:

#### Get Supabase Connection Strings
1. Go to your Supabase project dashboard
2. Navigate to **Project Settings → Database**
3. Scroll to **Connection String** section
4. Copy the **Transaction pooler** connection string → use for `DATABASE_URL`
5. Copy the **Session pooler** or **Direct** connection string → use for `DIRECT_URL`
6. Replace `[YOUR-PASSWORD]` with your actual database password
7. Replace `[YOUR-PROJECT-REF]` with your project reference

#### Get Supabase API Keys
1. In Supabase dashboard, go to **Project Settings → API**
2. Copy **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Copy **service_role** key → use for `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

#### Generate NextAuth Secret
Run this command in your terminal:
```bash
openssl rand -base64 32
```
Copy the output and paste it as `NEXTAUTH_SECRET`

#### Set Up Resend (Optional - for email sending)
1. Sign up at https://resend.com (free tier available)
2. Get your API key → use for `RESEND_API_KEY`
3. Verify your domain or use their test domain → use for `RESEND_FROM_EMAIL`

### 2. Configure Git User (if you haven't already)

```bash
git config --global user.email "you@example.com"
git config --global user.name "Your Name"
```

### 3. Run Database Migration

Once your environment variables are set up, run:

```bash
npm run db:migrate
```

This will:
- Create all database tables in Supabase
- Generate the Prisma Client
- Set up the initial migration

### 4. Install Recommended VS Code Extensions

When you open this project in VS Code, you'll be prompted to install recommended extensions. Click "Install All" to get:

- Tailwind CSS IntelliSense
- Prisma extension
- ESLint
- Prettier
- And more...

### 5. Start Development Server

```bash
npm run dev
```

Your app will be running at http://localhost:3000

### 6. Explore Your Database (Optional)

Open Prisma Studio to view and edit your database:

```bash
npm run db:studio
```

This opens a visual database editor at http://localhost:5555

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes without migration
- `npm run db:migrate` - Create and run migrations
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── api/auth/[...nextauth]/ # NextAuth API routes
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   └── globals.css             # Global styles
├── actions/                    # Server Actions
│   └── contracts.ts            # Contract CRUD operations
├── components/                 # React components (to be created)
├── lib/                        # Utilities and configuration
│   ├── prisma.ts               # Prisma client singleton
│   ├── auth.ts                 # NextAuth configuration
│   ├── utils.ts                # Utility functions
│   ├── validations/            # Zod schemas
│   │   └── contract.ts
│   └── email/                  # Email service
│       ├── resend.ts
│       └── templates/
│           └── contract-invitation.tsx
└── types/                      # TypeScript types
    └── index.ts

prisma/
└── schema.prisma               # Database schema
```

## Database Schema

The Prisma schema includes:

### Models
- **User** - User accounts with authentication
- **Account** / **Session** - NextAuth.js authentication
- **Contract** - Contract documents with status tracking
- **Signature** - E-signature requests and responses

### Enums
- **UserRole**: USER, ADMIN
- **ContractStatus**: DRAFT, SENT, COMPLETED, EXPIRED, CANCELLED
- **SignatureStatus**: PENDING, SIGNED, DECLINED, EXPIRED

## What's Included

### ✅ Core Infrastructure
- [x] Next.js 16 with TypeScript
- [x] Prisma ORM with Supabase PostgreSQL
- [x] NextAuth.js authentication
- [x] Server Actions for backend logic
- [x] Email service with Resend
- [x] Zod validation schemas
- [x] Tailwind CSS styling

### ✅ Development Tools
- [x] Prettier code formatting
- [x] ESLint linting
- [x] VS Code workspace settings
- [x] TypeScript strict mode
- [x] Git initialized

### 📋 To Be Built
- [ ] Authentication pages (login/register)
- [ ] Dashboard page
- [ ] Contract creation form
- [ ] Contract list view
- [ ] Contract editor
- [ ] Send contract interface
- [ ] Public signature page
- [ ] PDF generation
- [ ] UI components (buttons, forms, etc.)

## Learning Resources

- **Next.js**: https://nextjs.org/docs
- **Prisma**: https://www.prisma.io/docs
- **NextAuth.js**: https://next-auth.js.org/
- **Supabase**: https://supabase.com/docs
- **Resend**: https://resend.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Zod**: https://zod.dev/

## Troubleshooting

### Database Connection Issues
- Verify your Supabase credentials are correct in `.env`
- Check that your Supabase project is not paused
- Ensure you're using the correct pooler mode (Transaction vs Session)

### Prisma Client Not Found
Run: `npm run postinstall` or `npx prisma generate`

### TypeScript Errors
- Restart VS Code TypeScript server: `Cmd/Ctrl + Shift + P` → "TypeScript: Restart TS Server"
- Run: `npm run build` to see all TypeScript errors

## Next Features to Build

Once the setup is complete, you can start building:

1. **Authentication UI** - Login and registration pages
2. **Dashboard** - Overview of contracts and activity
3. **Contract Management** - Create, edit, view contracts
4. **Signature Flow** - Send contracts and collect signatures
5. **PDF Export** - Generate PDFs from contracts
6. **Email Templates** - Beautiful email notifications

---

Built with ❤️ using modern web technologies
