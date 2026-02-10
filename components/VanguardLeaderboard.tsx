import React from "react";
import { UserProfile } from "../types";
import VerificationBadge from "./VerificationBadge";

interface VanguardLeaderboardProps {
  profiles: UserProfile[];
  onAliasClick: (alias: string) => void;
}

const VanguardLeaderboard: React.FC<VanguardLeaderboardProps> = ({
  profiles,
  onAliasClick,
}) => {
  const sorted = [...profiles]
    .sort((a, b) => (b.totalTransmissions || 0) - (a.totalTransmissions || 0))
    .slice(0, 10);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-white">
          THE <span className="text-blue-500">VANGUARD</span>
        </h2>
        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.3em]">
          Elite Contributors(Top Users)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sorted.map((profile, index) => (
          <div
            key={profile.alias}
            onClick={() => onAliasClick(profile.alias)}
            className="group relative bg-slate-900/40 border border-slate-800 p-6 rounded-[32px] flex items-center gap-6 cursor-pointer hover:border-blue-500/50 hover:bg-slate-900 transition-all overflow-hidden"
          >
            <div
              className={`absolute inset-y-0 left-0 w-1 ${
                index < 3 ? "bg-blue-500" : "bg-slate-800"
              }`}
            />

            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-2xl ${
                index === 0
                  ? "bg-yellow-500 text-slate-950 scale-110"
                  : index === 1
                    ? "bg-slate-300 text-slate-950"
                    : index === 2
                      ? "bg-orange-600 text-white"
                      : "bg-slate-800 text-slate-500"
              }`}
            >
              {index + 1}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">
                  @{profile.alias}
                </span>
                {profile.is_verified && <VerificationBadge size="sm" />}
                {profile.is_admin && (
                  <span className="text-xs" title="Admin">
                    👑
                  </span>
                )}
                {index < 3 && (
                  <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-lg border border-blue-500/20 font-black">
                    ELITE
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">
                Joined {new Date(profile.joinedAt).toLocaleDateString()}
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-black text-blue-500">
                {profile.totalTransmissions || 0}
              </div>
              <div className="text-[8px] text-slate-600 font-black uppercase tracking-tighter">
                Posts
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VanguardLeaderboard;
