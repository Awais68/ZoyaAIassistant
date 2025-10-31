import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Simple test endpoint to verify API routing works
 * If you can access /api/test and get a 200 response, then API routing is working.
 * If you get 405, then there's a Vercel configuration issue or Deployment Protection is active.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    return res.status(200).json({
        success: true,
        message: 'API test endpoint is working!',
        method: req.method,
        timestamp: new Date().toISOString(),
    });
}
