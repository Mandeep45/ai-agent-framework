import type {
    PendingApproval,
} from "../types";

interface ApprovalModalProps {
    approval: PendingApproval;
    onApprove: () => void;
    onReject: () => void;
    isSubmitting: boolean;
}

export function ApprovalModal({
    approval,
    onApprove,
    onReject,
    isSubmitting,
}: ApprovalModalProps) {

    let formattedArgs =
        approval.argumentsJson;

    try {
        formattedArgs =
            JSON.stringify(
                JSON.parse(
                    approval.argumentsJson
                ),
                null,
                2
            );
    } catch {
        // keep raw string
    }

    return (
        <div className="modal-overlay">
            <div className="modal">
                <h2>Approval Required</h2>

                <p className="modal-description">
                    The agent wants to run a
                    sensitive action. Review
                    the details below.
                </p>

                <div className="approval-details">
                    <div className="detail-row">
                        <span className="label">
                            Tool
                        </span>
                        <span className="value">
                            {approval.toolName}
                        </span>
                    </div>

                    <div className="detail-row">
                        <span className="label">
                            Arguments
                        </span>
                        <pre className="args">
                            {formattedArgs}
                        </pre>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        type="button"
                        className="btn btn-reject"
                        onClick={onReject}
                        disabled={isSubmitting}
                    >
                        Reject
                    </button>

                    <button
                        type="button"
                        className="btn btn-approve"
                        onClick={onApprove}
                        disabled={isSubmitting}
                    >
                        {isSubmitting
                            ? "Submitting..."
                            : "Approve"}
                    </button>
                </div>
            </div>
        </div>
    );
}
