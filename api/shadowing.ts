import formidable from 'formidable';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Vercel standard requires disabling bodyParser for formidable
export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: any, res: any) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
        return res.status(500).json({ error: 'Supabase credentials not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const form = formidable({ multiples: false });

    form.parse(req, async (err: any, fields: any, files: any) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ error: 'Failed to process audio' });
        }

        const audioFile = files.audio;
        const userId = fields.userId?.[0]; // formidable v3 puts fields in arrays

        if (!audioFile || !userId) {
            return res.status(400).json({ error: 'Missing audio file or user ID' });
        }

        // Convert file to buffer for Supabase Storage
        // In formidable v3, file is an array
        const fileData = Array.isArray(audioFile) ? audioFile[0] : audioFile;

        try {
            const fileBuffer = fs.readFileSync(fileData.filepath);
            const fileName = `shadowing/${userId}/${Date.now()}-${fileData.originalFilename}`;

            // Upload to Supabase Storage (Assumes a bucket named 'audio' exists)
            const { data, error } = await supabase.storage
                .from('audio')
                .upload(fileName, fileBuffer, {
                    contentType: fileData.mimetype || 'audio/webm',
                    upsert: false
                });

            if (error) {
                throw error;
            }

            // Get public URL
            const { data: publicUrlData } = supabase.storage
                .from('audio')
                .getPublicUrl(fileName);

            // (Optional) Here you could call an external AI/Speech-to-Text API 
            // for pronunciation scoring using the public URL.

            return res.status(200).json({
                success: true,
                message: 'Audio processed',
                url: publicUrlData.publicUrl
            });

        } catch (uploadError: any) {
            console.error('Upload Error:', uploadError);
            return res.status(500).json({ error: 'Failed to upload audio to storage' });
        } finally {
            // Clean up temp file
            try {
                fs.unlinkSync(fileData.filepath);
            } catch (e) {
                console.error('Cleanup error:', e);
            }
        }
    });
}
