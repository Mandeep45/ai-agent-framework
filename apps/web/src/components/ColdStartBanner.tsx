interface ColdStartBannerProps {
    visible: boolean;
}

export function ColdStartBanner({
    visible,
}: ColdStartBannerProps) {

    if (!visible) {
        return null;
    }

    return (
        <div className="cold-start-banner">
            Waking up the server — on Render&apos;s
            free tier the first request can take up
            to 60 seconds.
        </div>
    );
}
