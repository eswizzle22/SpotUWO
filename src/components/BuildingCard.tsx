import type { StudySpot, StudyType, CrowdLevel } from '../types';
import { getStatusEmoji, getStatusLabel, getTimeSince } from '../utils/helpers';
import buildingImages from '../data/buildingImages';
import '../styles/BuildingCard.css';

type BuildingCardProps = {
  building: string;
  spots: StudySpot[];
  crowdLevel: CrowdLevel;
  studyTypes: StudyType[];
  isOpenNow: boolean;
  lastUpdatedTimestamp: number | null;
  isEstimated: boolean;
  onClick: () => void;
};

export default function BuildingCard({
  building,
  spots,
  crowdLevel,
  isOpenNow,
  lastUpdatedTimestamp,
  isEstimated,
  onClick,
}: BuildingCardProps) {
  const imageSrc = buildingImages[building] ?? '/images/weldon.jpg';

  // Crowd color for the status bar
  const crowdBg =
    crowdLevel === 'not busy'
      ? 'bg-green-500'
      : crowdLevel === 'moderate'
        ? 'bg-amber-400'
        : crowdLevel === 'crowded'
          ? 'bg-red-500'
          : 'bg-gray-400';

  const crowdTextColor =
    crowdLevel === 'moderate' ? 'text-amber-900' : 'text-white';

  const updatedText = lastUpdatedTimestamp
    ? `Updated ${getTimeSince(lastUpdatedTimestamp)}`
    : isEstimated
      ? 'Estimated'
      : 'No recent data';

  return (
    <button onClick={onClick} className="building-card">
      {/* Image section */}
      <div className="building-card-image-wrapper">
        <img src={imageSrc} alt={building} className="building-card-image" />
        <div className="building-card-overlay" />

        {/* Open/Closed pill — top right */}
        <div
          className={`absolute top-3 right-3 z-10 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${isOpenNow ? 'bg-green-500 text-white' : 'bg-black/60 text-gray-200'
            }`}
        >
          {isOpenNow ? '● Open' : '● Closed'}
        </div>

        {/* Building name — bottom of image */}
        <div className="building-card-title">{building}</div>
      </div>

      {/* Info section */}
      <div className="building-card-info">
        {/* STATUS STRIP — Closed takes over entirely when not open */}
        {!isOpenNow ? (
          <div className="building-card-crowd bg-gray-700">
            <span className="text-base mr-1">🔒</span>
            <span className="text-sm font-extrabold text-white">Closed</span>
          </div>
        ) : (
          <div className={`building-card-crowd ${crowdBg}`}>
            <span className="text-base mr-1">{getStatusEmoji(crowdLevel)}</span>
            <span className={`text-sm font-extrabold ${crowdTextColor}`}>
              {getStatusLabel(crowdLevel)}
            </span>
          </div>
        )}

        {/* Meta row: spots count + last updated */}
        <div className="building-card-meta">
          <span className="building-card-spots-count">{spots.length} spots</span>
          {isOpenNow && (
            <span className={`building-card-updated ${isEstimated && !lastUpdatedTimestamp ? 'text-gray-400' : 'text-violet-500'}`}>
              {isEstimated && !lastUpdatedTimestamp ? '📊 Est.' : `🕐 ${updatedText}`}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}