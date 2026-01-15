import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter
// Note: In serverless (Vercel), this map is per-lambda instance. 
// It resets when the lambda cold starts or scales.
// Ideally usage of Redis/Upstash is recommended for distributed state.
const rateLimit = new Map<string, { count: number; lastReset: number }>();

const WINDOW_SIZE = 60 * 1000; // 1 minute
const LIMIT = 60; // 60 requests per minute

export function middleware(request: NextRequest) {
    // Only rate limit API routes
    if (!request.nextUrl.pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Clean up old entries periodically (lazy cleanup on request)
    // or just handle current IP logic

    const now = Date.now();
    const record = rateLimit.get(ip) || { count: 0, lastReset: now };

    // Reset window if passed
    if (now - record.lastReset > WINDOW_SIZE) {
        record.count = 0;
        record.lastReset = now;
    }

    record.count++;
    rateLimit.set(ip, record);

    const remaining = Math.max(0, LIMIT - record.count);

    const response = record.count <= LIMIT
        ? NextResponse.next()
        : new NextResponse(JSON.stringify({ error: 'Too Many Requests', message: 'Rate limit exceeded. Please slow down.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' }
        });

    // Add RateLimit headers
    response.headers.set('X-RateLimit-Limit', LIMIT.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', (record.lastReset + WINDOW_SIZE).toString());

    return response;
}

export const config = {
    matcher: '/api/:path*',
};
