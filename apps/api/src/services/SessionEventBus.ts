export type SessionEventType =
    | "agent_started"
    | "tool_call"
    | "tool_result"
    | "approval_required"
    | "approval_resolved"
    | "agent_completed"
    | "agent_error";

export interface SessionEvent {
    type: SessionEventType;
    sessionId: string;
    timestamp: string;
    data?: Record<string, unknown>;
}

type SessionListener = (
    event: SessionEvent
) => void;

export class SessionEventBus {

    private readonly listeners =
        new Map<
            string,
            Set<SessionListener>
        >();

    subscribe(
        sessionId: string,
        listener: SessionListener
    ): () => void {

        if (
            !this.listeners.has(
                sessionId
            )
        ) {
            this.listeners.set(
                sessionId,
                new Set()
            );
        }

        this.listeners
            .get(sessionId)!
            .add(listener);

        return () => {
            this.listeners
                .get(sessionId)
                ?.delete(listener);
        };
    }

    emit(
        event: SessionEvent
    ): void {

        const listeners =
            this.listeners.get(
                event.sessionId
            );

        if (!listeners) {
            return;
        }

        for (
            const listener
            of listeners
        ) {
            listener(event);
        }
    }

    removeSession(
        sessionId: string
    ): void {
        this.listeners.delete(
            sessionId
        );
    }
}

export const sessionEventBus =
    new SessionEventBus();
