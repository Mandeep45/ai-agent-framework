import { randomUUID } from "node:crypto";

import type Database from "better-sqlite3";

import {
    ChatMessageRecord,
    ChatMessageRole,
} from "../../types/ChatMessageRecord";
import {
    ChatRepository,
} from "../ChatRepository";


export class SqliteChatRepository
    implements ChatRepository {

    constructor(
        private readonly db:
            Database.Database
    ) {}

    async ensureSession(
        sessionId: string
    ): Promise<void> {

        this.db.prepare(`
            INSERT INTO chat_sessions (id)
            VALUES (?)
            ON CONFLICT(id) DO UPDATE SET
                updated_at = datetime('now')
        `).run(sessionId);
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

        this.db.prepare(`
            INSERT INTO chat_messages (
                id,
                session_id,
                role,
                content
            ) VALUES (?, ?, ?, ?)
        `).run(
            messageId,
            sessionId,
            role,
            content
        );

        this.db.prepare(`
            UPDATE chat_sessions
            SET updated_at = datetime('now')
            WHERE id = ?
        `).run(sessionId);

        const row =
            this.db.prepare(`
                SELECT
                    id,
                    session_id,
                    role,
                    content,
                    created_at
                FROM chat_messages
                WHERE id = ?
            `).get(messageId) as {
                id: string;
                session_id: string;
                role: ChatMessageRole;
                content: string;
                created_at: string;
            };

        return {
            id: row.id,
            sessionId:
                row.session_id,
            role: row.role,
            content:
                row.content,
            createdAt:
                row.created_at,
        };
    }

    async getMessages(
        sessionId: string
    ): Promise<ChatMessageRecord[]> {

        const rows =
            this.db.prepare(`
                SELECT
                    id,
                    session_id,
                    role,
                    content,
                    created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
            `).all(sessionId) as Array<{
                id: string;
                session_id: string;
                role: ChatMessageRole;
                content: string;
                created_at: string;
            }>;

        return rows.map(row => ({
            id: row.id,
            sessionId:
                row.session_id,
            role: row.role,
            content:
                row.content,
            createdAt:
                row.created_at,
        }));
    }
}
