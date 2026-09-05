import type {
    ChatMessage,
} from "../types";

interface ChatWindowProps {
    messages: ChatMessage[];
    statusText: string;
    isLoading: boolean;
    input: string;
    onInputChange: (
        value: string
    ) => void;
    onSubmit: () => void;
}

export function ChatWindow({
    messages,
    statusText,
    isLoading,
    input,
    onInputChange,
    onSubmit,
}: ChatWindowProps) {

    function handleKeyDown(
        event: React.KeyboardEvent
    ) {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();
            onSubmit();
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
                            for product XYZ,
                            and place an order
                            for 1 unit.
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
                    placeholder="Ask the order assistant..."
                    rows={3}
                    disabled={isLoading}
                />

                <button
                    type="button"
                    className="btn btn-send"
                    onClick={onSubmit}
                    disabled={
                        isLoading ||
                        input.trim() === ""
                    }
                >
                    {isLoading
                        ? "Running..."
                        : "Send"}
                </button>
            </footer>
        </div>
    );
}
