function tryParseJson(
    value: string
): unknown {

    try {
        return JSON.parse(value);
    } catch {
        return value;
    }
}

function extractPayload(
    result: string
): unknown {

    const parsed = tryParseJson(result);

    if (
        typeof parsed !== "object" ||
        parsed === null
    ) {
        return parsed;
    }

    const record =
        parsed as Record<string, unknown>;

    if (
        record.type === "text" &&
        typeof record.text === "string"
    ) {
        return tryParseJson(
            record.text
        );
    }

    if (Array.isArray(parsed)) {

        const first = parsed[0] as
            | Record<string, unknown>
            | undefined;

        if (
            first?.type === "text" &&
            typeof first.text === "string"
        ) {
            return tryParseJson(
                first.text
            );
        }
    }

    if (Array.isArray(record.content)) {

        const first = record.content[0] as
            | Record<string, unknown>
            | undefined;

        if (
            first?.type === "text" &&
            typeof first.text === "string"
        ) {
            return tryParseJson(
                first.text
            );
        }
    }

    return parsed;
}

function formatCustomer(
    data: Record<string, unknown>
): string {

    const name =
        String(data.name ?? "Unknown");

    const id =
        String(data.id ?? "");

    const email =
        String(data.email ?? "");

    if (id && email) {
        return `Found ${name} (${id}) — ${email}`;
    }

    if (id) {
        return `Found ${name} (${id})`;
    }

    return `Found ${name}`;
}

function formatInventory(
    data: Record<string, unknown>
): string {

    const productId =
        String(data.productId ?? "Product");

    const quantity =
        Number(data.quantity ?? 0);

    const available =
        data.available === true;

    if (!available || quantity <= 0) {
        return `${productId} is out of stock`;
    }

    return `${productId}: ${quantity} units available`;
}

function formatOrder(
    data: Record<string, unknown>
): string {

    const orderId =
        String(data.id ?? "Order");

    const productId =
        String(data.productId ?? "");

    const quantity =
        String(data.quantity ?? "");

    const customerId =
        String(data.customerId ?? "");

    const status =
        String(data.status ?? "confirmed");

    return (
        `${orderId} ${status}` +
        ` — ${quantity}× ${productId}` +
        ` for customer ${customerId}`
    );
}

function formatOrderHistory(
    payload: unknown
): string {

    if (!Array.isArray(payload)) {
        return "No orders found.";
    }

    if (payload.length === 0) {
        return "No orders found for this customer.";
    }

    return payload
        .map(item => {
            const order =
                item as Record<
                    string,
                    unknown
                >;

            const line = formatOrder(order);

            const createdAt =
                order.createdAt;

            if (
                typeof createdAt ===
                "string"
            ) {
                return `${line} (${createdAt})`;
            }

            return line;
        })
        .join("\n");
}

function formatProductList(
    payload: unknown
): string {

    if (!Array.isArray(payload)) {
        return "No products available.";
    }

    if (payload.length === 0) {
        return "No products available.";
    }

    return payload
        .map(item => {
            const product =
                item as Record<
                    string,
                    unknown
                >;

            const name =
                String(
                    product.name ??
                        product.id ??
                        "Product"
                );

            const id =
                String(product.id ?? "");

            const quantity =
                Number(
                    product.quantity ?? 0
                );

            const stock =
                quantity > 0
                    ? `${quantity} in stock`
                    : "out of stock";

            return `${name} (${id}) — ${stock}`;
        })
        .join("\n");
}

function formatError(
    message: string
): string {

    if (
        message.toLowerCase().includes(
            "not found"
        )
    ) {
        return message;
    }

    return `Something went wrong: ${message}`;
}

export function formatToolResult(
    toolName: string,
    result: string
): string {

    const payload =
        extractPayload(result);

    if (typeof payload === "string") {

        if (
            payload.toLowerCase().includes(
                "error"
            )
        ) {
            return formatError(payload);
        }

        return payload;
    }

    if (Array.isArray(payload)) {

        if (toolName === "list_products") {
            return formatProductList(
                payload
            );
        }

        if (
            toolName ===
            "get_order_history"
        ) {
            return formatOrderHistory(
                payload
            );
        }
    }

    if (
        typeof payload !== "object" ||
        payload === null
    ) {
        return String(payload);
    }

    const data =
        payload as Record<string, unknown>;

    if (
        typeof data.message === "string" &&
        Object.keys(data).length <= 2
    ) {
        return formatError(
            data.message
        );
    }

    switch (toolName) {

        case "get_customer":
            return formatCustomer(data);

        case "get_inventory":
            return formatInventory(data);

        case "place_order":
        case "cancel_order":
        case "get_order":
            return formatOrder(data);

        default:
            return Object.entries(data)
                .map(
                    ([key, value]) =>
                        `${key}: ${String(value)}`
                )
                .join(" · ");
    }
}
