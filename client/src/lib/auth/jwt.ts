import { SignJWT, jwtVerify, JWTPayload } from 'jose';

const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET_KEY || 'default_secret'
);

export async function signToken(payload: JWTPayload): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h') // 24 hours expiration
        .sign(secretKey);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secretKey);
        return payload;
    } catch {
        return null;
    }
}
