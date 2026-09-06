import {
    Router,
    type Request,
    type Response,
} from "express";

import {
    CustomerNotFoundError,
} from "../../../../src/errors/CustomerNotFoundError";

import {
    getDomainServices,
} from "../services/domainServices";


export const ordersRouter =
    Router();

ordersRouter.get(
    "/",
    async (
        req: Request,
        res: Response
    ) => {

        const customerId =
            typeof req.query.customerId ===
            "string"
                ? req.query.customerId.trim()
                : undefined;

        try {

            const { orderService } =
                await getDomainServices();

            const orders =
                await orderService.listOrders(
                    customerId || undefined
                );

            res.json({ orders });

        } catch (error) {

            if (
                error instanceof
                CustomerNotFoundError
            ) {
                res.status(404).json({
                    error:
                        error.message,
                });
                return;
            }

            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to list orders.";

            res.status(500).json({
                error: errorMessage,
            });
        }
    }
);
