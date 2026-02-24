import { createClient } from '@supabase/supabase-js';

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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const supabaseKey = process.env.VITE_SUPABASE_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method === 'POST') {
        // SM-2 update logic will be implemented here
        // Parameters expected: word_id, user_id, quality
        const { word_id, user_id, quality } = req.body;

        // Simulate updating progress for now
        return res.status(200).json({ success: true, message: 'Progress updated', nextDate: new Date() });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
