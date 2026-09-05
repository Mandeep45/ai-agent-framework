import {
    MemorySession,
} from "@openai/agents";


export class SessionStore {

    private readonly sessions =
        new Map<
            string,
            MemorySession
        >();

    getOrCreate(
        sessionId: string
    ): MemorySession {

        let session =
            this.sessions.get(
                sessionId
            );

        if (!session) {

            session =
                new MemorySession({
                    sessionId,
                });

            this.sessions.set(
                sessionId,
                session
            );
        }

        return session;
    }

    remove(
        sessionId: string
    ): void {

        this.sessions.delete(
            sessionId
        );
    }
}

export const sessionStore =
    new SessionStore();
