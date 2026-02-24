import { createClient } from '@supabase/supabase-js';

/**
 * SM-2 Algorithm Implementation
 * Based on: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 *
 * Parameters:
 * - quality: 0-5 (0=complete blackout, 5=perfect response)
 * - interval: days until next review
 * - repetitions: number of times the item has been repeated
 * - easeFactor: difficulty multiplier (default 2.5)
 */
function calculateSM2(quality: number, easeFactor: number, interval: number, repetitions: number) {
  // Quality must be 0-5
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  let newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure ease factor doesn't go below 1.3
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  let newInterval: number;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // If quality is less than 3, reset the process
    newInterval = 1;
    newRepetitions = 0;
  } else {
    // Increment repetitions
    newRepetitions = repetitions + 1;

    // Calculate new interval
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return {
    interval: newInterval,
    easeFactor: parseFloat(newEaseFactor.toFixed(2)),
    repetitions: newRepetitions,
    nextReviewDate: new Date(Date.now() + newInterval * 24 * 60 * 60 * 1000),
  };
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const supabaseUrl = process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_KEY || '';

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ error: 'Supabase credentials not configured' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  if (req.method === 'POST') {
    try {
      const { user_id, word_id, quality } = req.body;

      if (!user_id || !word_id) {
        return res.status(400).json({ error: 'Missing user_id or word_id' });
      }

      if (quality === undefined || quality < 0 || quality > 5) {
        return res.status(400).json({ error: 'Quality must be between 0 and 5' });
      }

      // Get current word review record (or create default)
      const { data: reviewData, error: reviewError } = await supabase
        .from('word_reviews')
        .select('*')
        .eq('user_id', user_id)
        .eq('word_id', word_id)
        .single();

      let currentRecord = reviewData;

      // If record doesn't exist, create it
      if (reviewError && reviewError.code === 'PGRST116') {
        // No record exists, create one
        const { data: newRecord, error: createError } = await supabase
          .from('word_reviews')
          .insert({
            user_id,
            word_id,
            interval: 1,
            repetitions: 0,
            ease_factor: 2.5,
            next_review: new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (createError) {
          console.error('Failed to create word_review:', createError);
          return res.status(500).json({ error: 'Failed to create review record' });
        }

        currentRecord = newRecord;
      } else if (reviewError) {
        console.error('Failed to get word_review:', reviewError);
        return res.status(500).json({ error: 'Failed to fetch review record' });
      }

      // Calculate SM-2
      const sm2Result = calculateSM2(
        quality,
        currentRecord.ease_factor || 2.5,
        currentRecord.interval || 1,
        currentRecord.repetitions || 0
      );

      // Update word_review record
      const { error: updateError } = await supabase
        .from('word_reviews')
        .update({
          interval: sm2Result.interval,
          ease_factor: sm2Result.easeFactor,
          repetitions: sm2Result.repetitions,
          next_review: sm2Result.nextReviewDate.toISOString().split('T')[0],
          last_reviewed: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .eq('word_id', word_id);

      if (updateError) {
        console.error('Failed to update word_review:', updateError);
        return res.status(500).json({ error: 'Failed to update review' });
      }

      // Update user_progress (increment words_learned if first time quality >= 3)
      if ((currentRecord.repetitions || 0) === 0 && quality >= 3) {
        // This is the first successful review
        await supabase
          .from('user_progress')
          .update({ words_learned: currentRecord.words_learned ? currentRecord.words_learned + 1 : 1 })
          .eq('user_id', user_id);
      }

      return res.status(200).json({
        success: true,
        message: 'Progress updated with SM-2 algorithm',
        nextReviewDate: sm2Result.nextReviewDate,
        interval: sm2Result.interval,
        easeFactor: sm2Result.easeFactor,
        repetitions: sm2Result.repetitions,
      });
    } catch (error: any) {
      console.error('Progress API Error:', error);
      return res.status(500).json({ error: 'Failed to update progress' });
    }
  }

  // GET /api/progress - fetch user progress
  if (req.method === 'GET') {
    try {
      const userId = req.query.user_id;

      if (!userId) {
        return res.status(400).json({ error: 'Missing user_id query parameter' });
      }

      console.log('📊 Fetching progress for user:', userId);

      // Get or create user_progress
      let { data: progress, error: getError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (getError) {
        console.error('❌ Failed to get user_progress:', getError.message);
        return res.status(500).json({ error: `Query failed: ${getError.message}` });
      }

      if (!progress) {
        console.log('📝 Creating new user_progress for:', userId);
        // Create default user_progress for new user
        const { data: newProgress, error: createError } = await supabase
          .from('user_progress')
          .insert({
            user_id: userId,
            words_learned: 0,
            streak_days: 0,
            total_minutes: 0,
            xp: 0,
            current_level: 'A1',
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Failed to create user_progress:', createError.message);
          return res.status(500).json({ error: `Create failed: ${createError.message}` });
        }

        progress = newProgress;
        console.log('✅ Created new progress:', progress);
      } else {
        console.log('✅ Found existing progress:', progress);
      }

      return res.status(200).json(progress);
    } catch (error: any) {
      console.error('❌ Progress GET Error:', error);
      return res.status(500).json({ error: `Exception: ${error.message}` });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
