import { useMemo, useState } from 'react';
import type { StudySpot } from '../types';
import {
    distanceKm,
    getStatusEmoji,
    getStatusLabel,
    getStudyTypeLabel,
    walkingMinutes,
} from '../utils/helpers';

interface NearMePageProps {
    spots: StudySpot[];
    userLocation: { lat: number; lng: number } | null;
    onRequestLocation: () => void;
    onSpotSelect: (spot: StudySpot) => void;
}

type Preference = 'all' | 'silent' | 'group';

export default function NearMePage({
    spots,
    userLocation,
    onRequestLocation,
    onSpotSelect,
}: NearMePageProps) {
    const [preference, setPreference] = useState<Preference>('all');

    const ranked = useMemo(() => {
        if (!userLocation) return [];

        let filtered = spots;
        if (preference === 'silent') filtered = spots.filter((s) => s.studyType === 'silent');
        if (preference === 'group') filtered = spots.filter((s) => s.studyType === 'group');

        return filtered
            .map((s) => ({
                spot: s,
                km: distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng),
                minutes: walkingMinutes(distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)),
            }))
            .filter((s) => s.spot.crowdLevel !== 'crowded')
            .sort((a, b) => {
                const crowdScore = (l: string) => (l === 'not busy' ? 0 : l === 'moderate' ? 1 : 2);
                const confScore = (c: string) => (c === 'high' ? 0 : c === 'medium' ? 1 : 2);
                const scoreA = a.km * 2 + crowdScore(a.spot.crowdLevel) * 0.5 + confScore(a.spot.confidence) * 0.3;
                const scoreB = b.km * 2 + crowdScore(b.spot.crowdLevel) * 0.5 + confScore(b.spot.confidence) * 0.3;
                return scoreA - scoreB;
            })
            .slice(0, 8);
    }, [spots, userLocation, preference]);

    if (!userLocation) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
                <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center text-4xl mb-4">
                    📍
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Find spots near you</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">
                    Enable location to get ranked study spot recommendations based on distance, crowd level, and confidence.
                </p>
                <button
                    onClick={onRequestLocation}
                    className="px-6 py-3 rounded-xl bg-violet-600 text-white font-bold text-sm hover:bg-violet-700 transition-colors active:scale-95"
                >
                    Enable Location
                </button>
            </div>
        );
    }

    return (
        <div className="p-6 pb-28 space-y-5">
            <div>
                <h1 className="text-2xl font-bold text-violet-900">Best spots near you</h1>
                <p className="text-sm text-gray-500 mt-1">Ranked by distance, availability & confidence</p>
            </div>

            {/* Preference filter */}
            <div className="flex gap-2">
                {(['all', 'silent', 'group'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setPreference(t)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 border-2 ${preference === t
                                ? 'bg-violet-600 text-white border-violet-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-violet-400'
                            }`}
                    >
                        {t === 'all' ? '📋 All' : t === 'silent' ? '🤫 Silent' : '👥 Group'}
                    </button>
                ))}
            </div>

            {/* Ranked list */}
            <div className="space-y-3">
                {ranked.map(({ spot, minutes }, i) => (
                    <button
                        key={spot.id}
                        onClick={() => onSpotSelect(spot)}
                        className="w-full text-left rounded-2xl border-2 border-gray-100 bg-white p-4 shadow-sm hover:border-violet-300 hover:bg-violet-50 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-700 shrink-0">
                                    {i + 1}
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 text-sm truncate">{spot.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{spot.building}</p>
                                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                        <span>{getStatusEmoji(spot.crowdLevel)} {getStatusLabel(spot.crowdLevel)}</span>
                                        <span>·</span>
                                        <span>{getStudyTypeLabel(spot.studyType)}</span>
                                        <span>·</span>
                                        <span className="capitalize">{spot.confidence} confidence</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-lg font-bold text-violet-700">{minutes}</p>
                                <p className="text-[11px] text-gray-400">min walk</p>
                            </div>
                        </div>
                    </button>
                ))}

                {ranked.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-3xl mb-2">😔</p>
                        <p className="font-semibold">No available spots found nearby</p>
                        <p className="text-sm mt-1">Try changing your preference filter</p>
                    </div>
                )}
            </div>
        </div>
    );
}