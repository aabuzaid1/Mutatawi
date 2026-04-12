import jwt from 'jsonwebtoken';

/**
 * Generates a valid JSON Web Token (JWT) for Zhipu AI (GLM)
 * based on their Official Documentation.
 *
 * @param apiKey The raw API Key string from Zhipu (e.g. `id.secret`)
 * @returns signed JWT token valid for 1 hour
 */
export function generateZhipuToken(apiKey: string): string {
    if (!apiKey || !apiKey.includes('.')) {
        throw new Error('Invalid Zhipu API Key format. Expected `id.secret`');
    }

    const [id, secret] = apiKey.split('.');

    // Token expires in 1 hour
    const now = Date.now();
    const exp = now + 60 * 60 * 1000;

    const payload = {
        api_key: id,
        exp: exp,
        timestamp: now,
    };

    const token = jwt.sign(payload, secret, {
        algorithm: 'HS256',
        header: {
            alg: 'HS256',
            sign_type: 'SIGN'
        } as any
    });

    return token;
}
