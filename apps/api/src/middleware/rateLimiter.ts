import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    config,
} from "../../../../src/config";


interface RateLimitBucket {
    count: number;
    resetAt: number;
}

const buckets =
    new Map<string, RateLimitBucket>();

function getClientKey(
    req: Request
): string {

    const apiKey =
        req.header("x-api-key");

    if (apiKey) {
        return `key:${apiKey}`;
    }

    return `ip:${req.ip ?? "unknown"}`;
}

export function rateLimiter(
    req: Request,
    res: Response,
    next: NextFunction
): void {

    const {
        windowMs,
        maxRequests,
    } = config.api.rateLimit;

    if (maxRequests <= 0) {
        next();
        return;
    }

    const key = getClientKey(req);
    const now = Date.now();

    let bucket =
        buckets.get(key);

    if (
        !bucket ||
        now >= bucket.resetAt
    ) {
        bucket = {
            count: 0,
            resetAt:
                now + windowMs,
        };
    }

    bucket.count += 1;
    buckets.set(key, bucket);

    if (
        bucket.count >
        maxRequests
    ) {
        res.status(429).json({
            error:
                "Too many requests. Please try again later.",
        });
        return;
    }

    next();
}

export function resetRateLimiter(): void {
    buckets.clear();
}
