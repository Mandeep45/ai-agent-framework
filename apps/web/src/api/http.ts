const API_BASE = resolveApiBase();
const API_KEY =
    import.meta.env.VITE_API_KEY ?? "";

const CHAT_TIMEOUT_MS = 90_000;
const CHAT_RETRY_DELAY_MS = 5_000;

export function getApiBase(): string {
    return API_BASE;
}

export function resolveApiBase(): string {

    const configuredUrl =
        import.meta.env.VITE_API_URL;

    if (
        typeof configuredUrl === "string" &&
        configuredUrl.trim() !== ""
    ) {
        return `${configuredUrl.replace(
            /\/$/,
            ""
        )}/api`;
    }

    return "/api";
}

export function buildAuthHeaders(
    includeJson = false
): Record<string, string> {

    const headers: Record<string, string> =
        {};

    if (includeJson) {
        headers["Content-Type"] =
            "application/json";
    }

    if (API_KEY) {
        headers["x-api-key"] = API_KEY;
    }

    return headers;
}

export function getFrontendConfigError():
    string | null {

    const hostname =
        window.location.hostname;

    const isLocal =
        hostname === "localhost" ||
        hostname === "127.0.0.1";

    if (
        !isLocal &&
        API_BASE === "/api"
    ) {
        return (
            "Frontend is not configured with VITE_API_URL. " +
            "Set it on Render to your API URL and redeploy the web service."
        );
    }

    if (
        !isLocal &&
        !API_KEY
    ) {
        return (
            "Frontend is missing VITE_API_KEY. " +
            "Link it to the API service API_KEY on Render and redeploy the web service."
        );
    }

    return null;
}

function isLikelyColdStartError(
    error: unknown
): boolean {

    return (
        error instanceof TypeError ||
        (error instanceof Error &&
            error.name === "AbortError")
    );
}

async function fetchOnce(
    url: string,
    init: RequestInit,
    timeoutMs: number
): Promise<Response> {

    const controller =
        new AbortController();

    const timeoutId =
        window.setTimeout(
            () => {
                controller.abort();
            },
            timeoutMs
        );

    try {

        return await fetch(url, {
            ...init,
            signal: controller.signal,
        });

    } finally {
        window.clearTimeout(timeoutId);
    }
}

export async function fetchWithColdStart(
    url: string,
    init: RequestInit = {}
): Promise<Response> {

    const configError =
        getFrontendConfigError();

    if (configError) {
        throw new Error(configError);
    }

    try {

        return await fetchOnce(
            url,
            init,
            CHAT_TIMEOUT_MS
        );

    } catch (firstError) {

        if (
            !isLikelyColdStartError(
                firstError
            )
        ) {
            throw firstError;
        }

        await new Promise(resolve => {
            window.setTimeout(
                resolve,
                CHAT_RETRY_DELAY_MS
            );
        });

        try {

            return await fetchOnce(
                url,
                init,
                CHAT_TIMEOUT_MS
            );

        } catch {
            throw new Error(
                `Cannot reach API at ${url}. ` +
                    "The server may be waking up on Render's free tier — wait a minute and try again. " +
                    `Also verify WEB_ORIGIN is set to ${window.location.origin}.`
            );
        }
    }
}

export { API_KEY };
