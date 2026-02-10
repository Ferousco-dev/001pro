import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { PollData, UserProfile } from "../../types";

interface PollProps {
  postId: string;
  poll: PollData;
  user: UserProfile;
  isDarkMode: boolean;
}

export const Poll: React.FC<PollProps> = ({
  postId,
  poll,
  user,
  isDarkMode,
}) => {
  const [votes, setVotes] = useState<number[]>(
    new Array(poll.options.length).fill(0),
  );
  const [totalVotes, setTotalVotes] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);

  // Load initial vote status and counts
  useEffect(() => {
    fetchVoteData();
    const unsubscribe = subscribeToVotes();
    return () => {
      unsubscribe();
    };
  }, [postId]);

  const fetchVoteData = async () => {
    try {
      // 1. Get user's vote
      const { data: userData } = await supabase
        .from("poll_votes")
        .select("option_index")
        .eq("post_id", postId)
        .eq("user_alias", user.alias)
        .maybeSingle();

      if (userData) {
        setHasVoted(true);
        setSelectedOption(userData.option_index);
      }

      // 2. Get all votes for counts
      const { data: allVotes, error } = await supabase
        .from("poll_votes")
        .select("option_index")
        .eq("post_id", postId);

      if (error) throw error;

      if (allVotes) {
        const newVotes = new Array(poll.options.length).fill(0);
        allVotes.forEach((v) => {
          if (typeof v.option_index === "number") {
            newVotes[v.option_index] = (newVotes[v.option_index] || 0) + 1;
          }
        });
        setVotes(newVotes);
        setTotalVotes(allVotes.length);
      }
    } catch (error) {
      console.error("Error fetching poll data:", error);
    }
  };

  const subscribeToVotes = () => {
    const channel = supabase
      .channel(`poll_votes_${postId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to ALL events (INSERT, UPDATE, DELETE)
          schema: "public",
          table: "poll_votes",
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const eventType = payload.eventType;
          const newVote = payload.new as { option_index: number } | null;
          const oldVote = payload.old as { option_index: number } | null;

          setVotes((prev) => {
            const newVotes = [...prev];

            if (eventType === "INSERT" && newVote) {
              newVotes[newVote.option_index] =
                (newVotes[newVote.option_index] || 0) + 1;
              setTotalVotes((t) => t + 1);
            } else if (eventType === "DELETE" && oldVote) {
              newVotes[oldVote.option_index] = Math.max(
                0,
                (newVotes[oldVote.option_index] || 0) - 1,
              );
              setTotalVotes((t) => Math.max(0, t - 1));
            } else if (eventType === "UPDATE" && newVote && oldVote) {
              newVotes[oldVote.option_index] = Math.max(
                0,
                (newVotes[oldVote.option_index] || 0) - 1,
              );
              newVotes[newVote.option_index] =
                (newVotes[newVote.option_index] || 0) + 1;
              // Total votes doesn't change on update
            }

            return newVotes;
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleVote = async (index: number) => {
    if (isVoting) return;
    setIsVoting(true);

    try {
      if (hasVoted) {
        if (selectedOption === index) {
          // UNVOTE (Delete)
          const { error } = await supabase
            .from("poll_votes")
            .delete()
            .eq("post_id", postId)
            .eq("user_alias", user.alias);

          if (error) throw error;

          setHasVoted(false);
          setSelectedOption(null);
        } else {
          // CHANGE VOTE (Update)
          const { error } = await supabase
            .from("poll_votes")
            .update({ option_index: index })
            .eq("post_id", postId)
            .eq("user_alias", user.alias);

          if (error) throw error;

          setSelectedOption(index);
        }
      } else {
        // NEW VOTE (Insert)
        const { error } = await supabase.from("poll_votes").insert({
          post_id: postId,
          user_alias: user.alias,
          option_index: index,
        });

        if (error) throw error;

        setHasVoted(true);
        setSelectedOption(index);
      }
    } catch (error) {
      console.error("Voting error:", error);
      alert("Failed to update vote. Please try again.");
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div
      className={`mt-4 rounded-2xl overflow-hidden p-5 ${
        isDarkMode
          ? "bg-gradient-to-br from-neutral-900/40 to-neutral-900/60 border border-white/5 shadow-inner"
          : "bg-gradient-to-br from-white to-gray-50 border border-gray-100 shadow-sm"
      }`}
    >
      <h3
        className={`font-bold text-lg mb-4 tracking-tight ${
          isDarkMode ? "text-white" : "text-gray-900"
        }`}
      >
        {poll.question}
      </h3>

      <div className="space-y-3">
        {poll.options.map((option, idx) => {
          const voteCount = votes[idx] || 0;
          const percentage =
            totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const isSelected = selectedOption === idx;

          return (
            <button
              key={idx}
              onClick={() => handleVote(idx)}
              disabled={isVoting}
              className={`relative w-full text-left rounded-xl overflow-hidden transition-all duration-300 group ${
                isDarkMode ? "hover:bg-white/5" : "hover:bg-gray-50"
              }`}
            >
              {/* Progress Bar Background */}
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-700 ease-out ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-500/20 to-indigo-500/20"
                      : isDarkMode
                        ? "bg-white/5"
                        : "bg-black/5"
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}

              {/* Vote Button / Option Content */}
              <div
                className={`relative flex items-center justify-between p-3.5 sm:p-4 z-10 border transition-all duration-300 ${
                  isSelected
                    ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                    : isDarkMode
                      ? "border-white/10 group-hover:border-white/20"
                      : "border-gray-200 group-hover:border-gray-300"
                } rounded-xl`}
              >
                <div className="flex items-center gap-3">
                  {/* Custom Radio check */}
                  {hasVoted ? (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isSelected
                          ? "bg-blue-500 scale-100 shadow-md shadow-blue-500/30"
                          : isDarkMode
                            ? "bg-neutral-800 border border-neutral-700 text-transparent"
                            : "bg-gray-200 text-transparent"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-white animate-in zoom-in duration-200"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                        isDarkMode
                          ? "border-white/20 group-hover:border-blue-500 group-hover:scale-110"
                          : "border-gray-300 group-hover:border-blue-500 group-hover:scale-110"
                      }`}
                    />
                  )}

                  <span
                    className={`font-medium transition-colors ${
                      isSelected
                        ? "text-blue-500"
                        : isDarkMode
                          ? "text-gray-200"
                          : "text-gray-700"
                    }`}
                  >
                    {option.text}
                  </span>
                </div>

                {hasVoted && (
                  <span
                    className={`text-sm font-bold tracking-wide animate-in fade-in slide-in-from-right-2 duration-500 ${
                      isSelected
                        ? "text-blue-500"
                        : isDarkMode
                          ? "text-neutral-500"
                          : "text-gray-400"
                    }`}
                  >
                    {percentage}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className={`mt-4 flex items-center justify-between text-xs font-medium uppercase tracking-wider ${
          isDarkMode ? "text-white/30" : "text-gray-400"
        }`}
      >
        <span>{totalVotes.toLocaleString()} votes</span>
        <span>{hasVoted ? "Vote Recorded" : "Poll Active"}</span>
      </div>
    </div>
  );
};
