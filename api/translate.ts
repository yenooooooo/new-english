import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
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

    try {
        const { text, targetLanguage } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text is required for translation' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // System instruction prompt for translation
        const prompt = `You are a highly precise translator. Translate the following text completely naturally into ${targetLanguage || 'Korean'}. Keep the nuances. 
    Provide ONLY the translated text, without quotes or additional comments. Make sure it sounds like a native speaker would say it.
    
    Text: "${text}"`;

        const result = await model.generateContent(prompt);
        const translatedText = result.response.text();

        return res.status(200).json({ translation: translatedText.trim() });
    } catch (error: any) {
        console.error('Translation Error:', error);
        return res.status(500).json({ error: 'Failed to translate' });
    }
}
