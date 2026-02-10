import React, { useState } from "react";
import { AppSettings, UserProfile } from "../types";
import { supabase, isSupabaseConfigured } from "../supabaseClient";

interface DonationPageProps {
  settings: AppSettings;
  user?: UserProfile | null;
  onUpdateSettings?: (settings: AppSettings) => Promise<void>;
}

const DonationPage: React.FC<DonationPageProps> = ({
  settings,
  user,
  onUpdateSettings,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [accountNumber, setAccountNumber] = useState(
    settings.accountNumber || ""
  );
  const [accountName, setAccountName] = useState(settings.accountName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const isAdmin = user?.role === "ADMIN";
  const percent = Math.min(
    100,
    (settings.donationCurrent / settings.donationTarget) * 100
  );

  const handleSave = async () => {
    if (!isAdmin || !onUpdateSettings) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const updatedSettings: AppSettings = {
        ...settings,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim(),
        claudeHaiku45Enabled: true,
      };

      if (isSupabaseConfigured) {
        // First, try to get existing settings to preserve other fields
        const { data: existingSettings } = await supabase
          .from("settings")
          .select("*")
          .eq("id", 1)
          .single();

        // Update only the account fields, preserving other settings
        const updateData: any = {
          id: 1,
          account_number: accountNumber.trim(),
        };

        // Only include account_name if the column exists (try-catch for missing column)
        // If account_name column doesn't exist, we'll update it separately or skip it
        try {
          updateData.account_name = accountName.trim();
        } catch (e) {
          // Column might not exist, we'll handle it below
        }

        // Include other existing fields to preserve them
        if (existingSettings) {
          updateData.donation_target =
            existingSettings.donation_target ?? settings.donationTarget;
          updateData.donation_current =
            existingSettings.donation_current ?? settings.donationCurrent;
          updateData.announcement =
            existingSettings.announcement ?? settings.announcement;
          // We'll enable Claude Haiku 4.5 for all clients. The DB column
          // is `enable_claude_haiku_4_5` if present; handle missing column
          // gracefully below on upsert error.
          updateData.enable_claude_haiku_4_5 = true;
        } else {
          // If no existing record, include defaults
          updateData.donation_target = settings.donationTarget;
          updateData.donation_current = settings.donationCurrent;
          updateData.announcement = settings.announcement;
          updateData.enable_claude_haiku_4_5 = true;
        }

        // Try upsert with account_name first
        let { error } = await supabase.from("settings").upsert(updateData);

        // If account_name column doesn't exist, try without it
        if (
          error &&
          (error.message?.includes("account_name") || error.code === "PGRST204")
        ) {
          delete updateData.account_name;
          const { error: retryError } = await supabase
            .from("settings")
            .upsert(updateData);
          if (retryError) throw retryError;

          // If account_name column doesn't exist, we can't save it to Supabase
          // but we can still update local state
          console.warn(
            "Note: account_name column doesn't exist in settings table. " +
              "Only account_number was saved to Supabase. " +
              "Please add the account_name column to your settings table in Supabase."
          );
        } else if (error) {
          // If the error mentions our Claude flag column, retry without it
          if (
            error.message?.includes("enable_claude_haiku_4_5") ||
            error.code === "PGRST204"
          ) {
            delete updateData.enable_claude_haiku_4_5;
            const { error: retryError2 } = await supabase
              .from("settings")
              .upsert(updateData);
            if (retryError2) throw retryError2;
            console.warn(
              "Claude Haiku flag column not present; skipped DB enable."
            );
          } else {
            throw error;
          }
        }
      }

      await onUpdateSettings(updatedSettings);
      setIsEditing(false);
      setMessage({
        text: "Account details updated successfully!",
        type: "success",
      });

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating account details:", error);
      setMessage({ text: "Failed to update account details", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setAccountNumber(settings.accountNumber || "");
    setAccountName(settings.accountName || "");
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-12 animate-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-green-600/10 rounded-[32px] mx-auto flex items-center justify-center text-green-500 text-4xl mb-6 shadow-2xl shadow-green-600/20">
          ₦
        </div>
        <h2 className="text-4xl font-black tracking-tighter">
          SERVER <span className="text-green-500">SUPPORT</span>
        </h2>
        <p className="text-slate-500 font-medium">
          Help us keep the servers running and the leaks flowing. 100% of
          donations go to hosting costs.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[48px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 text-green-500/10 font-black text-8xl pointer-events-none italic">
          FUND
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex justify-between items-end">
            <div>
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                Current Progress
              </div>
              <div className="text-4xl font-black text-white">
                ₦{settings.donationCurrent.toLocaleString()}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">
                Goal
              </div>
              <div className="text-2xl font-black text-slate-400">
                ₦{settings.donationTarget.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="h-6 w-full bg-slate-950 rounded-full border border-slate-800 p-1">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-blue-600 rounded-full transition-all duration-1000 shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="bg-slate-950/50 border border-slate-800 p-6 rounded-3xl space-y-4 mt-10 relative">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">
                Bank Transfer Details
              </h4>
              {isAdmin && (
                <button
                  onClick={() =>
                    isEditing ? handleCancel() : setIsEditing(true)
                  }
                  className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg transition-all"
                >
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              )}
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-sm font-bold ${
                  message.type === "success"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-red-500/20 text-red-400 border border-red-500/30"
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-slate-600 font-bold">Account:</span>
                {isEditing && isAdmin ? (
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="flex-1 sm:max-w-xs px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black focus:outline-none focus:border-green-500"
                    placeholder="Account Number"
                  />
                ) : (
                  <span className="text-white font-black">
                    {settings.accountNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-slate-600 font-bold">Name:</span>
                {isEditing && isAdmin ? (
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="flex-1 sm:max-w-xs px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-black focus:outline-none focus:border-green-500"
                    placeholder="Account Name"
                  />
                ) : (
                  <span className="text-white font-black">
                    {settings.accountName}
                  </span>
                )}
              </div>
            </div>

            {isEditing && isAdmin && (
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-800">
                <button
                  onClick={handleSave}
                  disabled={
                    isSaving || !accountNumber.trim() || !accountName.trim()
                  }
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <p className="text-center text-[10px] text-slate-700 font-black uppercase tracking-[0.3em]">
        Thank you for supporting AnonPro
      </p>
    </div>
  );
};

export default DonationPage;
