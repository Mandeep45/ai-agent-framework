import {
    useEffect,
    useState,
} from "react";

import {
    clearStoredSessionId,
    createSessionId,
    loadStoredSessionId,
    parseApprovalEvent,
    parseToolCallEvent,
    parseToolResultEvent,
    respondToApproval,
    sendChatMessage,
    storeSessionId,
    subscribeToSessionEvents,
} from "./api/client";

import {
    fetchSessionMessages,
} from "./api/sessions";

import {
    ApprovalModal,
} from "./components/ApprovalModal";

import {
    AppNav,
    type AppView,
} from "./components/AppNav";

import {
    ChatWindow,
} from "./components/ChatWindow";

import {
    ColdStartBanner,
} from "./components/ColdStartBanner";

import {
    OrderHistoryPage,
} from "./components/OrderHistoryPage";

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

function resolveInitialSessionId(): string {

    return (
        loadStoredSessionId() ??
        createSessionId()
    );
}

export default function App() {

    const [activeView, setActiveView] =
        useState<AppView>("chat");

    const [sessionId, setSessionId] =
        useState(resolveInitialSessionId);

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

    const [isWakingServer, setIsWakingServer] =
        useState(false);

    const [isLoadingHistory, setIsLoadingHistory] =
        useState(true);

    const [pendingApproval, setPendingApproval] =
        useState<PendingApproval | null>(
            null
        );

    const [isSubmittingApproval, setIsSubmittingApproval] =
        useState(false);

    useEffect(() => {
        storeSessionId(sessionId);
    }, [sessionId]);

    useEffect(() => {

        let cancelled = false;

        async function loadHistory() {

            setIsLoadingHistory(true);

            try {

                const history =
                    await fetchSessionMessages(
                        sessionId
                    );

                if (!cancelled) {
                    setMessages(history);
                }

            } catch {
                if (!cancelled) {
                    setMessages([]);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingHistory(false);
                }
            }
        }

        void loadHistory();

        return () => {
            cancelled = true;
        };

    }, [sessionId]);

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
                        setIsWakingServer(false);
                    }

                    if (
                        event.type ===
                        "agent_error"
                    ) {
                        setStatusText(
                            "Error"
                        );
                        setIsWakingServer(false);
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
            pendingApproval ||
            isLoadingHistory
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
        setIsWakingServer(true);
        setStatusText(
            "Connecting to server..."
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
            setIsWakingServer(false);
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

        const nextSessionId =
            createSessionId();

        clearStoredSessionId();
        storeSessionId(nextSessionId);

        setSessionId(nextSessionId);
        setMessages([]);
        setToolSteps([]);
        setInput("");
        setStatusText("Ready");
        setPendingApproval(null);
        setIsLoadingHistory(false);
    }

    return (
        <div className="app">
            <AppNav
                activeView={activeView}
                onViewChange={setActiveView}
            />

            <ColdStartBanner
                visible={
                    isWakingServer ||
                    (isLoadingHistory &&
                        activeView === "chat")
                }
            />

            {activeView === "chat" ? (
                <ChatWindow
                    messages={messages}
                    toolSteps={toolSteps}
                    statusText={
                        isLoadingHistory
                            ? "Loading chat history..."
                            : statusText
                    }
                    isLoading={
                        isLoading ||
                        isLoadingHistory
                    }
                    isAwaitingApproval={
                        pendingApproval !== null
                    }
                    input={input}
                    onInputChange={setInput}
                    onSubmit={handleSend}
                    onNewChat={handleNewChat}
                    canStartNewChat={
                        !isLoading &&
                        !isSubmittingApproval &&
                        !isLoadingHistory
                    }
                />
            ) : (
                <OrderHistoryPage />
            )}

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
