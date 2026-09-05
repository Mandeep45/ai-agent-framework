import {
    useEffect,
    useState,
} from "react";

import {
    createSessionId,
    parseApprovalEvent,
    respondToApproval,
    sendChatMessage,
    subscribeToSessionEvents,
} from "./api/client";

import {
    ApprovalModal,
} from "./components/ApprovalModal";

import {
    ChatWindow,
} from "./components/ChatWindow";

import type {
    ChatMessage,
    PendingApproval,
} from "./types";

import "./App.css";

function createMessage(
    role: ChatMessage["role"],
    content: string
): ChatMessage {
    return {
        id: crypto.randomUUID(),
        role,
        content,
    };
}

export default function App() {

    const [sessionId] = useState(
        createSessionId
    );

    const [messages, setMessages] =
        useState<ChatMessage[]>([]);

    const [input, setInput] =
        useState("");

    const [statusText, setStatusText] =
        useState("Ready");

    const [isLoading, setIsLoading] =
        useState(false);

    const [pendingApproval, setPendingApproval] =
        useState<PendingApproval | null>(
            null
        );

    const [isSubmittingApproval, setIsSubmittingApproval] =
        useState(false);

    useEffect(() => {

        const unsubscribe =
            subscribeToSessionEvents(
                sessionId,
                event => {

                    if (
                        event.type ===
                        "agent_started"
                    ) {
                        setStatusText(
                            "Agent is working..."
                        );
                    }

                    if (
                        event.type ===
                        "approval_required"
                    ) {
                        const approval =
                            parseApprovalEvent(
                                event
                            );

                        if (approval) {
                            setPendingApproval(
                                approval
                            );
                            setStatusText(
                                "Waiting for approval"
                            );
                        }
                    }

                    if (
                        event.type ===
                        "approval_resolved"
                    ) {
                        setPendingApproval(
                            null
                        );
                        setStatusText(
                            "Resuming agent..."
                        );
                    }

                    if (
                        event.type ===
                        "agent_completed"
                    ) {
                        setStatusText(
                            "Ready"
                        );
                    }

                    if (
                        event.type ===
                        "agent_error"
                    ) {
                        setStatusText(
                            "Error"
                        );
                    }
                }
            );

        return unsubscribe;

    }, [sessionId]);

    async function handleSend() {

        const message =
            input.trim();

        if (!message || isLoading) {
            return;
        }

        setMessages(current => [
            ...current,
            createMessage(
                "user",
                message
            ),
        ]);

        setInput("");
        setIsLoading(true);
        setStatusText(
            "Sending request..."
        );

        try {

            const result =
                await sendChatMessage(
                    sessionId,
                    message
                );

            setMessages(current => [
                ...current,
                createMessage(
                    "assistant",
                    result.output
                ),
            ]);

            setStatusText("Ready");

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Something went wrong.";

            setMessages(current => [
                ...current,
                createMessage(
                    "system",
                    errorMessage
                ),
            ]);

            setStatusText("Error");

        } finally {

            setIsLoading(false);
            setPendingApproval(null);
        }
    }

    async function handleApproval(
        approved: boolean
    ) {

        if (
            !pendingApproval ||
            isSubmittingApproval
        ) {
            return;
        }

        setIsSubmittingApproval(true);

        try {

            await respondToApproval(
                sessionId,
                pendingApproval.approvalId,
                approved
            );

            if (!approved) {
                setPendingApproval(null);
                setStatusText(
                    "Approval rejected"
                );
            }

        } catch (error) {

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Approval failed.";

            setMessages(current => [
                ...current,
                createMessage(
                    "system",
                    errorMessage
                ),
            ]);

        } finally {

            setIsSubmittingApproval(false);
        }
    }

    return (
        <div className="app">
            <ChatWindow
                messages={messages}
                statusText={statusText}
                isLoading={isLoading}
                input={input}
                onInputChange={setInput}
                onSubmit={handleSend}
            />

            {pendingApproval && (
                <ApprovalModal
                    approval={
                        pendingApproval
                    }
                    onApprove={() =>
                        handleApproval(true)
                    }
                    onReject={() =>
                        handleApproval(false)
                    }
                    isSubmitting={
                        isSubmittingApproval
                    }
                />
            )}
        </div>
    );
}
