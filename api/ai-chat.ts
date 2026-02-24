import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export default async function handler(req: any, res: any) {
    // CORS configuration
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
        const { messages } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages format is invalid' });
        }

        // Get the generative model
        // We use gemini-1.5-pro for better conversational nuance, though gemini-1.5-flash is faster
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        // Format chat history for Gemini API
        // Gemini expects 'user' and 'model' roles
        const formattedHistory = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Start Chat
        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 800,
                temperature: 0.7, // Balances creativity with consistency
            }
        });

        const userLastMessage = messages[messages.length - 1].content;

        // System instruction injected to steer behavior
        const prompt = `You are a friendly, encouraging Native English Teacher. 
    Correct any major grammar or naturalness mistakes in this message politely before answering: 
    "${userLastMessage}"`;

        const result = await chat.sendMessage(prompt);
        const text = result.response.text();

        return res.status(200).json({ reply: text });

    } catch (error: any) {
        console.error('Gemini API Error:', error);
        return res.status(500).json({ error: 'Failed to generate response' });
    }
}
