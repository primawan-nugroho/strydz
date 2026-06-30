import { getCurrentAthlete } from "@/lib/activities";
import { LogIn } from "lucide-react";

export default async function SettingsPage() {
  const athlete = await getCurrentAthlete();

  return (
    <div>
      <h1 className="text-[18px] font-medium mb-4">Settings</h1>

      <div className="bg-surface-2 rounded-2xl p-4 mb-3">
        <p className="text-[13px] font-medium mb-1">Account</p>
        <p className="text-xs text-text-muted mb-3">Signed in with demo data as {athlete.name}.</p>
        <button
          disabled
          className="w-full flex items-center justify-center gap-2 rounded-full bg-accent-bg text-accent-text text-[13px] font-medium py-2.5"
        >
          <LogIn size={16} /> Connect Strava account
        </button>
        <p className="text-[11px] text-text-muted mt-2 text-center">
          Strava connection is not wired up yet — currently running on sample data.
        </p>
      </div>
    </div>
  );
}
