import { getReputationLevel } from '../utils/helpers';
import { REWARDS } from '../types';
import type { User } from '../types';

interface ProfilePageProps {
    currentUser: User;
    onSignOut: () => void;
}


export default function ProfilePage({ currentUser, onSignOut }: ProfilePageProps) {
    const { points, totalUpdates } = currentUser;
    const rep = getReputationLevel(points);

    const nextLevel = points < 10 ? 10 : points < 30 ? 30 : points < 60 ? 60 : null;
    const prevLevel = points < 10 ? 0 : points < 30 ? 10 : points < 60 ? 30 : 60;
    const progress = nextLevel ? ((points - prevLevel) / (nextLevel - prevLevel)) * 100 : 100;

    return (
        <div className="p-5 pb-28 space-y-5 max-w-2xl mx-auto">

            {/* ── User card ── */}
            <div className="rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center text-3xl shrink-0">
                        {rep.badge}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-lg font-bold text-violet-900 truncate">{currentUser.displayName}</p>
                        <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
                        <p className="text-xs text-violet-600 font-semibold mt-0.5">{rep.label} · {rep.weight}x trust weight</p>
                    </div>
                    <button
                        onClick={onSignOut}
                        className="shrink-0 text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200"
                    >
                        Sign out
                    </button>
                </div>

                {/* Progress bar */}
                {nextLevel ? (
                    <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
                            <span>{points} pts</span>
                            <span>{nextLevel} pts to next level</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-violet-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-violet-600 transition-all duration-500"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-violet-600 font-bold">🏆 Max level reached!</p>
                )}
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border-2 border-violet-100 bg-white p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-violet-900">{points}</p>
                    <p className="text-sm text-gray-500 mt-1">Total Points</p>
                </div>
                <div className="rounded-2xl border-2 border-violet-100 bg-white p-4 text-center shadow-sm">
                    <p className="text-3xl font-bold text-violet-900">{totalUpdates}</p>
                    <p className="text-sm text-gray-500 mt-1">Updates Submitted</p>
                </div>
            </div>

            {/* ── Rewards ── */}
            <div className="rounded-2xl border-2 border-violet-200 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-violet-900 mb-4">🎁 Rewards</h2>
                <div className="space-y-3">
                    {REWARDS.map((reward) => {
                        const unlocked = points >= reward.points;
                        return (
                            <div
                                key={reward.points}
                                className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all ${unlocked ? 'border-violet-400 bg-violet-50' : 'border-gray-100 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <span className="text-2xl">{reward.emoji}</span>
                                <div className="flex-1">
                                    <p className={`font-semibold text-sm ${unlocked ? 'text-violet-900' : 'text-gray-600'}`}>
                                        {reward.label}
                                    </p>
                                    <p className="text-xs text-gray-500">{reward.description}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    {unlocked ? (
                                        <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">
                                            Unlocked ✓
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-semibold">{reward.points} pts</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="text-xs text-gray-400 mt-4 text-center">
                    Visit the Student Services desk to redeem rewards
                </p>
            </div>

            {/* ── How to earn ── */}
            <div className="rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-sm">
                <h2 className="text-base font-bold text-gray-800 mb-3">📊 How to earn points</h2>
                <div className="space-y-2 text-sm">
                    {[
                        ['Submit a crowd update (must be on-site)', '+5 pts'],
                        ['Your update confirmed accurate (upvoted)', '+3 pts'],
                        ['Consistent helpful updates', '+2 pts'],
                    ].map(([action, pts]) => (
                        <div key={action} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                            <span className="text-gray-600">{action}</span>
                            <span className="font-bold text-violet-600">{pts}</span>
                        </div>
                    ))}
                </div>
            </div>

            
            
        </div>
    );
}