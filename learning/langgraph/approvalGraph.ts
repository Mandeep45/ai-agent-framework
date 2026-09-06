import {
    StateGraph,
    StateSchema,
    START,
    END,
    interrupt,
    MemorySaver,
} from "@langchain/langgraph";

import { z } from "zod";

const State = new StateSchema({
    message: z.string(),
    approved: z.boolean().optional(),
    result: z.string().optional(),
});

const approvalNode = async (
    state: typeof State.State
) => {
    const decision = interrupt({
        message: state.message,
        question: "Do you approve this action?",
    });

    return {
        approved: decision === "yes",
    };
};

const approvedNode = async () => {
    console.log(
        "[Approval] Executing approved action"
    );

    return {
        result:
            "Action approved and executed.",
    };
};

const rejectedNode = async () => {
    console.log(
        "[Approval] Action rejected"
    );

    return {
        result:
            "Action rejected by user.",
    };
};

const routeAfterApproval = (
    state: typeof State.State
) => {
    console.log(
        "[Approval Router]",
        {
            approved: state.approved,
        }
    );

    if (state.approved === true) {
        return "approved";
    }

    return "rejected";
};

const checkpointer = new MemorySaver();

export const approvalGraph =
    new StateGraph(State)

        .addNode(
            "approval",
            approvalNode
        )

        .addNode(
            "approvalSuccess",
            approvedNode
        )

        .addNode(
            "approvalRejected",
            rejectedNode
        )

        .addEdge(
            START,
            "approval"
        )

        .addConditionalEdges(
            "approval",
            routeAfterApproval,
            {
                approved: "approvalSuccess",
                rejected: "approvalRejected",
            }
        )

        .addEdge(
            "approvalSuccess",
            END
        )

        .addEdge(
            "approvalRejected",
            END
        )

        .compile({
            checkpointer,
        });