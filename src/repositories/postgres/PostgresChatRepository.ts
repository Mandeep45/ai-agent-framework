import type { Pool, PoolClient } from "pg";
import { randomUUID } from "node:crypto";

import {
    ChatMessageRecord,
    ChatMessageRole,
} from "../../types/ChatMessageRecord";
import {
    ChatRepository,
} from "../ChatRepository";


type Queryable = Pool | PoolClient;

export class PostgresChatRepository
    implements ChatRepository {

    constructor(
        private readonly db: Queryable
    ) {}

    async ensureSession(
        sessionId: string
    ): Promise<void> {

        await this.db.query(
            `
                INSERT INTO chat_sessions (id)
                VALUES ($1)
                ON CONFLICT (id) DO UPDATE SET
                    updated_at = NOW()
            `,
            [sessionId]
        );
    }

    async appendMessage(
        sessionId: string,
        role: ChatMessageRole,
        content: string
    ): Promise<ChatMessageRecord> {

        await this.ensureSession(
            sessionId
        );

        const messageId =
            randomUUID();

        await this.db.query(
            `
                INSERT INTO chat_messages (
                    id,
                    session_id,
                    role,
                    content
                ) VALUES ($1, $2, $3, $4)
            `,
            [
                messageId,
                sessionId,
                role,
                content,
            ]
        );

        await this.db.query(
            `
                UPDATE chat_sessions
                SET updated_at = NOW()
                WHERE id = $1
            `,
            [sessionId]
        );

        const result =
            await this.db.query<{
                id: string;
                session_id: string;
                role: ChatMessageRole;
                content: string;
                created_at: Date;
            }>(
                `
                    SELECT
                        id,
                        session_id,
                        role,
                        content,
                        created_at
                    FROM chat_messages
                    WHERE id = $1
                `,
                [messageId]
            );

        const row =
            result.rows[0];

        return {
            id: row.id,
            sessionId:
                row.session_id,
            role: row.role,
            content:
                row.content,
            createdAt:
                row.created_at.toISOString(),
        };
    }

    async getMessages(
        sessionId: string
    ): Promise<ChatMessageRecord[]> {

        const result =
            await this.db.query<{
                id: string;
                session_id: string;
                role: ChatMessageRole;
                content: string;
                created_at: Date;
            }>(
                `
                    SELECT
                        id,
                        session_id,
                        role,
                        content,
                        created_at
                    FROM chat_messages
                    WHERE session_id = $1
                    ORDER BY created_at ASC
                `,
                [sessionId]
            );

        return result.rows.map(
            row => ({
                id: row.id,
                sessionId:
                    row.session_id,
                role: row.role,
                content:
                    row.content,
                createdAt:
                    row.created_at.toISOString(),
            })
        );
    }
}
