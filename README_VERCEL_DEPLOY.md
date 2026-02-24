# Vercel English Platform - Deployment Guide

This guide covers how to test, run, and deploy your new Vercel-based English Learning Platform.

## System Architecture
The application has been restructured to use Vercel's powerful serverless architecture:
- **Frontend**: React + Vite (hosted on Vercel Edge).
- **Backend**: API endpoints inside `/api` directory using Vercel Serverless Functions.
- **Database**: Supabase PostgreSQL and Auth.
- **AI**: Google Gemini API via serverless proxy logic.

## Prerequisites

1. Create a [Supabase Project](https://supabase.com).
2. Obtain a [Google Gemini API Key](https://aistudio.google.com/app/apikey).
3. Create a `.env.local` file at the root of the project with the following:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   GEMINI_API_KEY=your_gemini_api_key
   ```
4. Install Vercel CLI: `npm i -g vercel`

## Running Locally

Because we are using Vercel Serverless Functions (located in the `/api` folder), simply running `npm run dev` with Vite will **not** serve the API routes correctly.

Instead, use Vercel Dev:

```bash
vercel dev
```

1. It will prompt you to set up and link the project to your Vercel account.
2. It will automatically detect your Vite configuration and start parsing `/api` routes!
3. Check `http://localhost:3000` to interact with your frontend and backend seamlessly.

## Database Setup (Supabase)

To make everything work smoothly, ensure you have the following tables created in your Supabase SQL editor:

### 1. `user_progress`
```sql
create table user_progress (
  user_id uuid references auth.users not null primary key,
  words_learned int default 0,
  streak_days int default 0,
  total_minutes int default 0
);
```

### 2. `vocabulary`
```sql
create table vocabulary (
  id uuid default uuid_generate_v4() primary key,
  word text not null,
  meaning text not null,
  example text,
  phonetic text
);
```

### 3. `collocations`
```sql
create table collocations (
  id uuid default uuid_generate_v4() primary key,
  word text not null,
  collocation text not null,
  example_sentence text,
  korean_meaning text
);
```

> Ensure Row Level Security (RLS) is configured based on your security preferences for these tables. For development, you can disable RLS or allow read access.

## Deploying to Vercel

Deployment is extremely easy!

1. Make sure all your changes are committed to Git.
2. Run the deployment command:
   ```bash
   vercel
   ```
3. For a production release, use:
   ```bash
   vercel --prod
   ```
4. **Important**: Go to your Vercel dashboard and add the Environment Variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_KEY`, `GEMINI_API_KEY`) to your project settings!

## Technical Highlights
- **Vite Proxy Bypass**: Handled via `vercel.json` meaning APIs proxy flawlessly.
- **Glassmorphism Design**: High quality animations utilizing Tailwind.
- **Micro-interactions**: Subtle hover states, animated shine buttons.
- **Serverless Formidable**: Implemented for Audio Blob Shadowing parsing.
