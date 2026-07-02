import { getDashboardData, isLiveMode } from "@/lib/activities";
import ThemeToggle from "@/components/ThemeToggle";
import InstallButton from "@/components/InstallButton";
import { LogIn, LogOut, Zap, CircleAlert, TriangleAlert } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  denied: "Strava sign-in was cancelled.",
  exchange_failed: "Couldn't complete sign-in with Strava. Try again.",
  no_seed: "No seed token configured in .env.local.",
  seed_failed: "Seed token was rejected by Strava — it may have expired.",
  missing_scope:
    "Strava didn't grant activity access. When connecting, keep “View data about your activities” checked, then try again.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ strava_connected?: string; strava_error?: string }>;
}) {
  const params = await searchParams;
  const connected = await isLiveMode();
  const { athlete, source, errorDetail } = await getDashboardData();
  const liveDataWorking = source === "live";
  const errorMessage = params.strava_error ? ERROR_MESSAGES[params.strava_error] : null;

  return (
    <div>
      <h1 className="text-[18px] font-medium mb-4">Settings</h1>

      {params.strava_connected && (
        <div className="bg-surface-2 rounded-2xl p-3.5 mb-3 text-[13px] text-success-text">
          Connected to Strava.
        </div>
      )}
      {errorMessage && (
        <div className="bg-surface-2 rounded-2xl p-3.5 mb-3 flex items-start gap-2 text-[13px] text-accent-text">
          <CircleAlert size={16} className="shrink-0 mt-0.5" />
          {errorMessage}
        </div>
      )}
      {connected && !liveDataWorking && (
        <div className="bg-surface-2 rounded-2xl p-3.5 mb-3 flex items-start gap-2 text-[13px] text-accent-text">
          <TriangleAlert size={16} className="shrink-0 mt-0.5" />
          <div>
            <p>
              Connected, but activities couldn&apos;t be loaded. Showing demo data until this
              resolves.
            </p>
            {errorDetail && (
              <p className="mt-1 text-[11px] text-text-muted font-mono break-all">
                {errorDetail}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <p className="text-[13px] font-medium mb-1">Account</p>
        <p className="text-xs text-text-muted mb-3">
          {connected
            ? `Connected to Strava as ${athlete.name}.`
            : `Signed in with demo data as ${athlete.name}.`}
        </p>

        {connected ? (
          <form action="/api/strava/disconnect" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-surface-1 border border-border text-[13px] font-medium py-2.5"
            >
              <LogOut size={16} /> Disconnect Strava
            </button>
          </form>
        ) : (
          <div className="flex flex-col gap-2">
            <a
              href="/api/strava/authorize"
              className="w-full flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-text text-[13px] font-medium py-2.5"
            >
              <LogIn size={16} /> Connect Strava account
            </a>
            <form action="/api/strava/seed" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-surface-1 border border-border text-text-secondary text-[12px] font-medium py-2"
              >
                <Zap size={14} /> Quick-connect with dev seed token
              </button>
            </form>
          </div>
        )}

        <p className="text-[11px] text-text-muted mt-2 text-center">
          {liveDataWorking
            ? "Showing your real Strava activities, with a demo-data fallback if a request fails."
            : "Not connected with full access — running on sample data until reconnected."}
        </p>
      </div>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <p className="text-[13px] font-medium mb-3">Appearance</p>
        <ThemeToggle />
      </div>

      <div className="bg-surface-2 rounded-2xl p-4">
        <p className="text-[13px] font-medium mb-3">Install app</p>
        <InstallButton />
      </div>
    </div>
  );
}
