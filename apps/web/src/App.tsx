import {
    useEffect,
    useState,
} from "react";

import {
    createSessionId,
    parseApprovalEvent,
    parseToolCallEvent,
    parseToolResultEvent,
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
    ToolStep,
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

function upsertToolStep(
    steps: ToolStep[],
    nextStep: ToolStep
): ToolStep[] {

    const index =
        steps.findIndex(
            step =>
                step.id === nextStep.id
        );

    if (index === -1) {
        return [
            ...steps,
            nextStep,
        ];
    }

    const updated = [...steps];

    updated[index] = {
        ...updated[index],
        ...nextStep,
    };

    return updated;
}

export default function App() {

    const [sessionId, setSessionId] =
        useState(createSessionId);

    const [messages, setMessages] =
        useState<ChatMessage[]>([]);

    const [toolSteps, setToolSteps] =
        useState<ToolStep[]>([]);

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
                        setToolSteps([]);
                        setStatusText(
                            "Agent is working..."
                        );
                    }

                    const toolCall =
                        parseToolCallEvent(
                            event
                        );

                    if (toolCall) {
                        setToolSteps(
                            current =>
                                upsertToolStep(
                                    current,
                                    toolCall
                                )
                        );
                    }

                    const toolResult =
                        parseToolResultEvent(
                            event
                        );

                    if (toolResult) {
                        setToolSteps(
                            current =>
                                upsertToolStep(
                                    current,
                                    {
                                        id:
                                            toolResult.stepId,
                                        toolName:
                                            toolResult.toolName,
                                        status:
                                            toolResult.success
                                                ? "completed"
                                                : "failed",
                                        result:
                                            toolResult.result,
                                    }
                                )
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
                        const approved =
                            event.data?.approved ===
                            true;

                        setPendingApproval(
                            null
                        );

                        setMessages(
                            current => [
                                ...current,
                                createMessage(
                                    "approval",
                                    approved
                                        ? `${pendingApproval?.toolName ?? "Action"} approved.`
                                        : `${pendingApproval?.toolName ?? "Action"} was rejected.`
                                ),
                            ]
                        );

                        setStatusText(
                            approved
                                ? "Resuming agent..."
                                : "Ready"
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

        if (
            !message ||
            isLoading ||
            pendingApproval
        ) {
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
        setToolSteps([]);
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

            setPendingApproval(null);

        } finally {

            setIsSubmittingApproval(false);
        }
    }

    function handleNewChat() {

        if (
            isLoading ||
            isSubmittingApproval
        ) {
            return;
        }

        setSessionId(
            createSessionId()
        );
        setMessages([]);
        setToolSteps([]);
        setInput("");
        setStatusText("Ready");
        setPendingApproval(null);
    }

    return (
        <div className="app">
            <ChatWindow
                messages={messages}
                toolSteps={toolSteps}
                statusText={statusText}
                isLoading={isLoading}
                isAwaitingApproval={
                    pendingApproval !== null
                }
                input={input}
                onInputChange={setInput}
                onSubmit={handleSend}
                onNewChat={handleNewChat}
                canStartNewChat={
                    !isLoading &&
                    !isSubmittingApproval
                }
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
