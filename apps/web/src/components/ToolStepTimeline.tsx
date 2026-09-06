import type {
    ToolStep,
} from "../types";

import {
    formatToolResult,
} from "../utils/formatToolResult";

const TOOL_LABELS: Record<
    string,
    string
> = {
    get_customer:
        "Looking up customer",
    list_customers:
        "Listing customers",
    get_inventory:
        "Checking inventory",
    list_products:
        "Listing products",
    get_order_history:
        "Fetching order history",
    get_order:
        "Looking up order",
    place_order:
        "Placing order",
    cancel_order:
        "Cancelling order",
};

function getToolLabel(
    toolName: string
): string {

    return (
        TOOL_LABELS[toolName] ??
        `Running ${toolName}`
    );
}

function getStatusLabel(
    status: ToolStep["status"]
): string {

    switch (status) {
        case "running":
            return "In progress";
        case "completed":
            return "Done";
        case "failed":
            return "Failed";
    }
}

interface ToolStepTimelineProps {
    steps: ToolStep[];
}

export function ToolStepTimeline({
    steps,
}: ToolStepTimelineProps) {

    if (steps.length === 0) {
        return null;
    }

    return (
        <div className="tool-timeline">
            <div className="tool-timeline-title">
                Agent steps
            </div>

            {steps.map(step => (
                <div
                    key={step.id}
                    className={`tool-step tool-step-${step.status}`}
                >
                    <div className="tool-step-indicator" />

                    <div className="tool-step-body">
                        <div className="tool-step-name">
                            {getToolLabel(
                                step.toolName
                            )}
                        </div>

                        <div className="tool-step-meta">
                            {getStatusLabel(
                                step.status
                            )}
                        </div>

                        {step.result && (
                            <p className="tool-step-result">
                                {formatToolResult(
                                    step.toolName,
                                    step.result
                                )}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
