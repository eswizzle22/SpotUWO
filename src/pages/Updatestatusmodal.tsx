import { useState } from 'react';
import { Send, X, MapPin, AlertCircle, ThumbsUp, ThumbsDown } from 'lucide-react';
import type { CrowdLevel, NoiseLevel, SeatingEstimate, StudySpot, Report, User } from '../types';
import { isUserNearSpot, getTimeSince } from '../utils/helpers';

// ─────────────────────────────────────────────
// Update Status Modal
// ─────────────────────────────────────────────
interface UpdateStatusModalProps {
    spot: StudySpot;
    currentUser: User;
    onClose: () => void;
    onSubmit: (spotId: string, crowd: CrowdLevel, noise: NoiseLevel, seating?: SeatingEstimate) => void;
}

type SubmitStep = 'form' | 'checking' | 'not-near' | 'submitted';

export function UpdateStatusModal({ spot, currentUser, onClose, onSubmit }: UpdateStatusModalProps) {
    const [step, setStep] = useState<SubmitStep>('form');
    const [crowd, setCrowd] = useState<CrowdLevel | null>(null);
    const [noise, setNoise] = useState<NoiseLevel | null>(null);
    const [seating, setSeating] = useState<SeatingEstimate | null>(null);
    const [geoError, setGeoError] = useState('');

    const handleSubmit = () => {
        if (!crowd || !noise) return;
        if (!navigator.geolocation) {
            setGeoError('Geolocation not supported on your device.');
            return;
        }
        setStep('checking');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const near = isUserNearSpot(pos.coords.latitude, pos.coords.longitude, spot.lat, spot.lng);
                if (near) {
                    onSubmit(spot.id, crowd, noise, seating ?? undefined);
                    setStep('submitted');
                } else {
                    setStep('not-near');
                }
            },
            () => {
                setGeoError('Could not get your location. Make sure location is enabled.');
                setStep('not-near');
            },
            { timeout: 8000, maximumAge: 30000 },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border-2 border-violet-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-violet-100 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-bold text-violet-900">📝 Update Status</h2>
                        <p className="text-xs text-gray-500 mt-0.5">{spot.name}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {step === 'checking' && (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-3 animate-pulse">
                                <MapPin className="w-6 h-6 text-violet-600" />
                            </div>
                            <p className="font-semibold text-gray-800">Verifying your location…</p>
                            <p className="text-sm text-gray-500 mt-1">You must be at this spot to submit.</p>
                        </div>
                    )}

                    {step === 'not-near' && (
                        <div className="text-center py-6">
                            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <p className="font-bold text-gray-900 mb-1">You're not at this spot</p>
                            <p className="text-sm text-gray-500 mb-1">
                                You must be physically inside <span className="font-semibold">{spot.building}</span> to submit an update.
                            </p>
                            {geoError && <p className="text-xs text-red-500 mt-2">{geoError}</p>}
                            <p className="text-xs text-gray-400 mt-3 font-semibold">0 points awarded</p>
                            <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold text-sm">
                                Close
                            </button>
                        </div>
                    )}

                    {step === 'submitted' && (
                        <div className="text-center py-6">
                            <p className="text-4xl mb-3">🎉</p>
                            <p className="text-xl font-bold text-violet-900 mb-1">Thanks, {currentUser.displayName.split(' ')[0]}!</p>
                            <p className="text-sm text-gray-500">Your update helps other students find good spots.</p>
                            <p className="text-lg font-bold text-violet-600 mt-3">+5 points</p>
                            <button onClick={onClose} className="mt-4 px-6 py-2 rounded-lg bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700">
                                Done
                            </button>
                        </div>
                    )}

                    {step === 'form' && (
                        <>
                            <div className="flex items-start gap-2 p-3 rounded-xl bg-violet-50 border border-violet-200 mb-5">
                                <MapPin className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                                <p className="text-xs text-violet-700 font-medium">
                                    You must be physically present at this location. We verify your location when you hit submit.
                                </p>
                            </div>

                            {/* Crowd */}
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">How crowded is it?</p>
                                <div className="flex gap-2">
                                    {(['not busy', 'moderate', 'crowded'] as const).map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setCrowd(val)}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${crowd === val
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-violet-400'
                                                }`}
                                        >
                                            {val === 'not busy' ? '🟢 Quiet' : val === 'moderate' ? '🟡 Moderate' : '🔴 Crowded'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Noise */}
                            <div className="mb-4">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Noise level?</p>
                                <div className="flex gap-2">
                                    {(['quiet', 'moderate', 'loud'] as const).map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setNoise(val)}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${noise === val
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-violet-400'
                                                }`}
                                        >
                                            {val === 'quiet' ? '🤫 Quiet' : val === 'moderate' ? '💬 Medium' : '📢 Loud'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Seating */}
                            <div className="mb-5">
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">
                                    Seating? <span className="normal-case font-normal text-gray-400">(optional)</span>
                                </p>
                                <div className="flex gap-2">
                                    {(['few', 'some', 'many'] as const).map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setSeating(seating === val ? null : val)}
                                            className={`flex-1 py-3 rounded-xl text-xs font-bold border-2 transition-all active:scale-95 ${seating === val
                                                    ? 'bg-violet-600 text-white border-violet-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-violet-400'
                                                }`}
                                        >
                                            {val === 'few' ? 'Few seats' : val === 'some' ? 'Some seats' : 'Many seats'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={!crowd || !noise}
                                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40 shadow-md"
                            >
                                <Send className="w-4 h-4" />
                                Submit · Earn +5 pts
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Vote Button — geo-gated upvote/downvote
// ─────────────────────────────────────────────
interface VoteButtonsProps {
    report: Report;
    currentUser: User;
    spotLat: number;
    spotLng: number;
    onVote: (reportId: string, direction: 'up' | 'down') => void;
}

type VoteStep = 'idle' | 'checking' | 'not-near' | 'voted';

export function VoteButtons({ report, currentUser, spotLat, spotLng, onVote }: VoteButtonsProps) {
    const alreadyVoted = currentUser.votedReports.includes(report.id);
    const [voteStep, setVoteStep] = useState<VoteStep>(alreadyVoted ? 'voted' : 'idle');
    const [pendingDir, setPendingDir] = useState<'up' | 'down' | null>(null);
    const [notNearMsg, setNotNearMsg] = useState('');

    const handleVote = (dir: 'up' | 'down') => {
        if (voteStep === 'voted' || voteStep === 'checking') return;
        setPendingDir(dir);
        setVoteStep('checking');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const near = isUserNearSpot(pos.coords.latitude, pos.coords.longitude, spotLat, spotLng);
                if (near) {
                    onVote(report.id, dir);
                    setVoteStep('voted');
                } else {
                    setNotNearMsg('You must be at this location to vote.');
                    setVoteStep('not-near');
                    setTimeout(() => setVoteStep('idle'), 3000);
                }
            },
            () => {
                setNotNearMsg('Location access denied. Enable location to vote.');
                setVoteStep('not-near');
                setTimeout(() => setVoteStep('idle'), 3000);
            },
            { timeout: 6000, maximumAge: 30000 },
        );
    };

    if (voteStep === 'not-near') {
        return (
            <span className="text-[11px] text-red-500 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {notNearMsg}
            </span>
        );
    }

    if (voteStep === 'checking') {
        return <span className="text-[11px] text-gray-400 animate-pulse">Checking location…</span>;
    }

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={() => handleVote('up')}
                disabled={voteStep === 'voted'}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${voteStep === 'voted' && pendingDir === 'up'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600'
                    } disabled:cursor-not-allowed`}
            >
                <ThumbsUp className="w-3 h-3" />
                {report.upvotes + (voteStep === 'voted' && pendingDir === 'up' ? 1 : 0)}
            </button>
            <button
                onClick={() => handleVote('down')}
                disabled={voteStep === 'voted'}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${voteStep === 'voted' && pendingDir === 'down'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    } disabled:cursor-not-allowed`}
            >
                <ThumbsDown className="w-3 h-3" />
                {report.downvotes + (voteStep === 'voted' && pendingDir === 'down' ? 1 : 0)}
            </button>
            {voteStep === 'idle' && (
                <span className="text-[10px] text-gray-400">📍 Must be on-site to vote</span>
            )}
            {voteStep === 'voted' && alreadyVoted && (
                <span className="text-[10px] text-gray-400">Already voted</span>
            )}
            <span className="text-[10px] text-gray-400 ml-1">{getTimeSince(report.timestamp)}</span>
        </div>
    );
}