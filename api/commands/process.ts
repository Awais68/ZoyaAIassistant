import { VercelRequest, VercelResponse } from '@vercel/node';
import { processNaturalLanguageCommand } from '../../server/services/gemini';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { input, language = 'en' } = req.body;

        if (!input || typeof input !== 'string' || input.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid input: must be a non-empty string',
            });
        }

        // Process the command
        const aiResponse = await processNaturalLanguageCommand(input, language);

        return res.status(200).json({
            success: true,
            response: aiResponse.response,
            language: aiResponse.language,
            intent: aiResponse.intent,
        });
    } catch (error) {
        console.error('Command processing error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to process command',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
}
