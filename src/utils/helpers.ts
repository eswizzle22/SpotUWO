import type { CrowdLevel, NoiseLevel, Report, SeatingEstimate, StudyType, StudySpot } from '../types';

export const REPORT_EXPIRY_MS = 20 * 60 * 1000; // 20 minutes
export const LOCATION_RADIUS_KM = 0.15; // must be within ~150m of building to submit

export function getReputationLevel(points: number) {
  if (points >= 60) return { label: 'Campus Expert', weight: 3, badge: '🏆' };
  if (points >= 30) return { label: 'Trusted', weight: 2, badge: '⭐' };
  if (points >= 10) return { label: 'Regular', weight: 1.5, badge: '🎯' };
  return { label: 'New User', weight: 1, badge: '🌱' };
}

export function aggregateReports(reports: Report[]): {
  crowd: CrowdLevel;
  noise: NoiseLevel;
  seating: SeatingEstimate;
  isEstimated: boolean;
  confidence: 'low' | 'medium' | 'high';
  recentCount: number;
} {
  const now = Date.now();
  const fresh = reports.filter((r) => now - r.timestamp < REPORT_EXPIRY_MS);

  if (fresh.length === 0) {
    return {
      crowd: 'unknown',
      noise: 'unknown',
      seating: 'unknown',
      isEstimated: true,
      confidence: 'low',
      recentCount: 0,
    };
  }

  const crowdMap: Record<string, number> = {};
  const noiseMap: Record<string, number> = {};
  const seatMap: Record<string, number> = {};

  for (const r of fresh) {
    const w = r.upvotes - r.downvotes + 1; // weight by votes
    crowdMap[r.crowd] = (crowdMap[r.crowd] || 0) + w;
    noiseMap[r.noise] = (noiseMap[r.noise] || 0) + w;
    if (r.seating && r.seating !== 'unknown') {
      seatMap[r.seating] = (seatMap[r.seating] || 0) + w;
    }
  }

  const topCrowd = Object.entries(crowdMap).sort((a, b) => b[1] - a[1])[0][0] as CrowdLevel;
  const topNoise = Object.entries(noiseMap).sort((a, b) => b[1] - a[1])[0][0] as NoiseLevel;
  const seatEntries = Object.entries(seatMap).filter(([, v]) => v > 0);
  const topSeat = seatEntries.length > 0
    ? (seatEntries.sort((a, b) => b[1] - a[1])[0][0] as SeatingEstimate)
    : 'unknown';

  const confidence: 'low' | 'medium' | 'high' =
    fresh.length >= 5 ? 'high' : fresh.length >= 2 ? 'medium' : 'low';

  return {
    crowd: topCrowd,
    noise: topNoise,
    seating: topSeat,
    isEstimated: false,
    confidence,
    recentCount: fresh.length,
  };
}

export function isOpenNow(spot: StudySpot): boolean {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  return h >= spot.openHour && h < spot.closeHour;
}

export function getTimeSince(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  return `${Math.floor(mins / 60)}h ago`;
}

export function getStatusLabel(level: CrowdLevel) {
  switch (level) {
    case 'not busy': return 'Available';
    case 'moderate': return 'Moderate';
    case 'crowded': return 'Crowded';
    default: return 'Unknown';
  }
}

export function getStatusEmoji(level: CrowdLevel) {
  switch (level) {
    case 'not busy': return '🟢';
    case 'moderate': return '🟡';
    case 'crowded': return '🔴';
    default: return '⚪';
  }
}

export function getStatusHex(level: CrowdLevel) {
  switch (level) {
    case 'not busy': return '#22c55e';
    case 'moderate': return '#f59e0b';
    case 'crowded': return '#ef4444';
    default: return '#9ca3af';
  }
}

export function getStatusColor(level: CrowdLevel) {
  switch (level) {
    case 'not busy': return 'bg-green-500';
    case 'moderate': return 'bg-amber-400';
    case 'crowded': return 'bg-red-500';
    default: return 'bg-gray-400';
  }
}

export function getStudyTypeLabel(type: StudyType) {
  switch (type) {
    case 'silent': return 'Silent Study';
    case 'group': return 'Group Study';
    case 'mixed': return 'Mixed';
  }
}

export function getSeatingLabel(s: SeatingEstimate) {
  switch (s) {
    case 'few': return 'Few seats';
    case 'some': return 'Some seats';
    case 'many': return 'Many seats';
    default: return 'Unknown';
  }
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkingMinutes(km: number) {
  return Math.round(km / 0.08);
}

/** Returns true if user is within LOCATION_RADIUS_KM of the spot */
export function isUserNearSpot(
  userLat: number,
  userLng: number,
  spotLat: number,
  spotLng: number,
): boolean {
  return distanceKm(userLat, userLng, spotLat, spotLng) <= LOCATION_RADIUS_KM;
}