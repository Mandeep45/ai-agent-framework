import { Message } from "../types/message";

export class MessageHistory {
    private messages: Message[] = [];

    add(message: Message): void {
        this.messages.push(message);
    }

    getAll(): Message[] {
        return this.messages;
    }

    clear(): void {
        this.messages = [];
    }
}