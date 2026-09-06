import type {
    ChatMessage,
    ToolStep,
} from "../types";

import {
    ToolStepTimeline,
} from "./ToolStepTimeline";

interface ChatWindowProps {
    messages: ChatMessage[];
    toolSteps: ToolStep[];
    statusText: string;
    isLoading: boolean;
    isAwaitingApproval: boolean;
    input: string;
    onInputChange: (
        value: string
    ) => void;
    onSubmit: () => void;
}

export function ChatWindow({
    messages,
    toolSteps,
    statusText,
    isLoading,
    isAwaitingApproval,
    input,
    onInputChange,
    onSubmit,
}: ChatWindowProps) {

    const inputDisabled =
        isLoading ||
        isAwaitingApproval;

    function handleKeyDown(
        event: React.KeyboardEvent
    ) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            if (!inputDisabled) {
                onSubmit();
            }
        }
    }

    return (
        <div className="chat-layout">
            <header className="chat-header">
                <div>
                    <h1>Order Assistant</h1>
                    <p>
                        Find customers, check
                        inventory, and place
                        orders with human
                        approval.
                    </p>
                </div>

                <div className="status-pill">
                    {statusText}
                </div>
            </header>

            <main className="chat-messages">
                {messages.length === 0 && (
                    <div className="empty-state">
                        <p>
                            Try: Find customer
                            ABC, check inventory
                            for product IPH14,
                            and place an order
                            for 1 unit.
                        </p>
                        <p>
                            Then follow up with:
                            &quot;What was the
                            order ID?&quot; or
                            &quot;Show order history
                            for customer ABC&quot; or
                            &quot;What products are
                            available?&quot;
                        </p>
                    </div>
                )}

                {messages.map(message => (
                    <div
                        key={message.id}
                        className={`message message-${message.role}`}
                    >
                        <div className="message-role">
                            {message.role}
                        </div>
                        <div className="message-content">
                            {message.content}
                        </div>
                    </div>
                ))}

                <ToolStepTimeline
                    steps={toolSteps}
                />
            </main>

            <footer className="chat-input">
                <textarea
                    value={input}
                    onChange={event =>
                        onInputChange(
                            event.target.value
                        )
                    }
                    onKeyDown={handleKeyDown}
                    placeholder={
                        isAwaitingApproval
                            ? "Waiting for approval..."
                            : "Ask the order assistant..."
                    }
                    rows={3}
                    disabled={inputDisabled}
                />

                <button
                    type="button"
                    className="btn btn-send"
                    onClick={onSubmit}
                    disabled={
                        inputDisabled ||
                        input.trim() === ""
                    }
                >
                    {isLoading
                        ? "Running..."
                        : isAwaitingApproval
                          ? "Awaiting approval"
                          : "Send"}
                </button>
            </footer>
        </div>
    );
}
