# Phase 0: Foundation Setup Guide

## ✅ Code Changes Completed
1. ✅ AuthProvider.tsx - Added error handling for getSession()
2. ✅ Register.tsx - Fixed memory leak with setTimeout cleanup
3. ✅ Login.tsx - Added returnUrl redirect support
4. ✅ api/progress.ts - Fixed env vars (VITE_ → server-side)
5. ✅ api/vocabulary.ts - Fixed env vars
6. ✅ api/shadowing.ts - Fixed env vars
7. ✅ package.json - Changed name to "nativetalk"

---

## 📋 Supabase Schema Setup

### Step 1: Create Tables (Run in Supabase SQL Editor)

```sql
-- 1. vocabulary table (단어 테이블)
CREATE TABLE IF NOT EXISTS vocabulary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(255) NOT NULL,
    meaning VARCHAR(255) NOT NULL,
    example_en TEXT NOT NULL,
    example_ko TEXT NOT NULL,
    cefr_level VARCHAR(10) NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    category VARCHAR(100),
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. user_progress table (학습 진행도)
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    words_learned INT DEFAULT 0,
    streak_days INT DEFAULT 0,
    total_minutes INT DEFAULT 0,
    xp INT DEFAULT 0,
    current_level VARCHAR(10) DEFAULT 'A1' CHECK (current_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 3. collocations table (연어 학습)
CREATE TABLE IF NOT EXISTS collocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL,
    collocation VARCHAR(255) NOT NULL,
    example_sentence TEXT NOT NULL,
    korean_meaning VARCHAR(255),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. user_streaks table (스트릭 추적)
CREATE TABLE IF NOT EXISTS user_streaks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_study_date DATE,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 5. daily_missions table (일일 미션)
CREATE TABLE IF NOT EXISTS daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vocab_done BOOLEAN DEFAULT FALSE,
    chat_done BOOLEAN DEFAULT FALSE,
    translate_done BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, mission_date)
);

-- 6. shadowing_sentences table (섀도잉 문장)
CREATE TABLE IF NOT EXISTS shadowing_sentences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_en TEXT NOT NULL,
    text_ko TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty IN ('easy', 'intermediate', 'hard')),
    audio_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. chat_history table (채팅 히스토리)
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scenario VARCHAR(100) NOT NULL,
    messages JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. word_reviews table (SM-2 알고리즘용)
CREATE TABLE IF NOT EXISTS word_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    word_id UUID NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    interval INT DEFAULT 1,
    repetitions INT DEFAULT 0,
    ease_factor DECIMAL(3,2) DEFAULT 2.5,
    next_review DATE DEFAULT CURRENT_DATE,
    last_reviewed TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
CREATE INDEX idx_daily_missions_user_id ON daily_missions(user_id);
CREATE INDEX idx_word_reviews_user_id ON word_reviews(user_id);
CREATE INDEX idx_word_reviews_next_review ON word_reviews(next_review);
CREATE INDEX idx_vocabulary_cefr_level ON vocabulary(cefr_level);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);

-- Insert sample vocabulary data (optional)
INSERT INTO vocabulary (word, meaning, example_en, example_ko, cefr_level, category) VALUES
('hello', '안녕하세요', 'Hello, how are you?', '안녕하세요, 어떻게 지내세요?', 'A1', 'greetings'),
('beautiful', '아름다운', 'The sunset is beautiful.', '그 석양은 아름답다.', 'A2', 'adjectives'),
('ambiguous', '모호한', 'His statement was ambiguous.', '그의 진술은 모호했다.', 'C1', 'advanced'),
('make a decision', '결정을 내리다', 'You need to make a decision.', '너는 결정을 내려야 한다.', 'B1', 'expressions');
```

### Step 2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (users can only see their own data)
CREATE POLICY "Users can only view their own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own streaks"
    ON user_streaks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own missions"
    ON daily_missions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own word reviews"
    ON word_reviews FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can only view their own chat history"
    ON chat_history FOR SELECT
    USING (auth.uid() = user_id);

-- Insert/Update policies
CREATE POLICY "Users can insert their own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks"
    ON user_streaks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks"
    ON user_streaks FOR UPDATE
    USING (auth.uid() = user_id);

-- Similar policies for other tables...
-- (Repeat INSERT/UPDATE for daily_missions, word_reviews, chat_history)

-- Public read-only access for vocabulary and collocations
CREATE POLICY "Anyone can view vocabulary"
    ON vocabulary FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can view collocations"
    ON collocations FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "Anyone can view shadowing sentences"
    ON shadowing_sentences FOR SELECT
    TO anon, authenticated
    USING (true);
```

---

## 🔐 Vercel Environment Variables Setup

### Step 1: Get Your Supabase Credentials
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy:
   - **Project URL** (for `SUPABASE_URL`)
   - **anon public key** (for `VITE_SUPABASE_URL` and `VITE_SUPABASE_KEY` on client)
   - **service_role key** (for `SUPABASE_KEY` on server)

### Step 2: Configure Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your NativeTalk project
3. Click **Settings** → **Environment Variables**

### Step 3: Add the Following Variables

#### Client-side (used in browser):
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (anon public key)
```

#### Server-side (used in API routes only):
```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

#### Gemini API (for AI chat & translation):
```
GEMINI_API_KEY = AIzaSy... (from Google Cloud Console)
```

### Step 4: Redeploy
After adding environment variables:
1. Commit and push to your repository
2. Vercel will automatically redeploy with the new environment variables
3. Or manually trigger a redeploy in Vercel dashboard

---

## ✅ Verification Checklist

- [ ] All tables created in Supabase
- [ ] RLS policies enabled and configured
- [ ] Environment variables set in Vercel
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Deployed successfully to Vercel
- [ ] Test registration/login flow works
- [ ] Check Supabase to see user_progress created on first login

---

## 🚀 Next Steps
Once Phase 0 is verified, proceed to **Phase 1: Homepage + Navigation Upgrade**

See the main plan document for details.
