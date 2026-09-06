import type {
    NextFunction,
    Request,
    Response,
} from "express";

import {
    config,
} from "../../../../src/config";


function extractApiKey(
    req: Request
): string | undefined {

    const headerKey =
        req.header("x-api-key");

    if (headerKey) {
        return headerKey;
    }

    const authorization =
        req.header("authorization");

    if (
        authorization?.startsWith(
            "Bearer "
        )
    ) {
        return authorization.slice(7);
    }

    const queryKey =
        req.query.apiKey;

    if (
        typeof queryKey === "string" &&
        queryKey.trim() !== ""
    ) {
        return queryKey;
    }

    return undefined;
}


export function apiKeyAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {

    if (!config.api.key) {
        next();
        return;
    }

    const provided =
        extractApiKey(req);

    if (
        provided === config.api.key
    ) {
        next();
        return;
    }

    res.status(401).json({
        error: "Unauthorized",
    });
}
