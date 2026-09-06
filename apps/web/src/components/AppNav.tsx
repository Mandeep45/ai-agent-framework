export type AppView = "chat" | "orders";

interface AppNavProps {
    activeView: AppView;
    onViewChange: (
        view: AppView
    ) => void;
}

export function AppNav({
    activeView,
    onViewChange,
}: AppNavProps) {

    return (
        <nav className="app-nav">
            <button
                type="button"
                className={
                    activeView === "chat"
                        ? "nav-link active"
                        : "nav-link"
                }
                onClick={() =>
                    onViewChange("chat")
                }
            >
                Chat
            </button>

            <button
                type="button"
                className={
                    activeView === "orders"
                        ? "nav-link active"
                        : "nav-link"
                }
                onClick={() =>
                    onViewChange("orders")
                }
            >
                Order history
            </button>
        </nav>
    );
}
