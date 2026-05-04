export type CrowdLevel = 'not busy' | 'moderate' | 'crowded' | 'unknown';
export type FilterType = 'all' | 'silent' | 'group' | 'available' | 'outlets' | 'near me' | 'open now';
export type NoiseLevel = 'quiet' | 'moderate' | 'loud' | 'unknown';
export type StudyType = 'silent' | 'group' | 'mixed';
export type SpotSize = 'small' | 'medium' | 'large';
export type SeatingEstimate = 'few' | 'some' | 'many' | 'unknown';
export type TabId = 'list' | 'map' | 'nearme' | 'profile';

export interface Report {
  id: string;
  crowd: CrowdLevel;
  noise: NoiseLevel;
  seating?: SeatingEstimate;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  submittedBy?: string; // user email
}

export interface StudySpot {
  id: string;
  name: string;
  code: string;
  building: string;
  address: string;
  studyType: StudyType;
  size: SpotSize;
  hasOutlets: boolean | null;
  foodAllowed: boolean | null;
  hours: string;
  openHour: number;
  closeHour: number;
  crowdLevel: CrowdLevel;
  noiseLevel: NoiseLevel;
  isEstimated: boolean;
  lastUpdated: string | null;
  lastUpdatedTimestamp: number | null;
  reportsCount: number;
  confidence: 'low' | 'medium' | 'high';
  description: string;
  floor?: string;
  lat: number;
  lng: number;
  reports: Report[];
  seating: SeatingEstimate;
}

// ─── Auth ───────────────────────────────────────
export interface User {
  email: string;
  displayName: string;
  points: number;
  totalUpdates: number;
  createdAt: number;
  votedReports: string[]; // report IDs this user has already voted on
}

export interface AuthState {
  user: User | null;
  isLoggedIn: boolean;
}

// ─── Rewards ────────────────────────────────────
export interface Reward {
  points: number;
  label: string;
  description: string;
  emoji: string;
}

export const REWARDS: Reward[] = [
  { points: 100, label: 'Spoke USC Gift Card', description: '$5 gift card', emoji: '☕' },
  { points: 200, label: 'Dellece Family Bookstore', description: '$20 gift card', emoji: '📚' },
  { points: 300, label: 'Founders Café', description: '$5 gift card', emoji: '🚀' },
];

export const ALLOWED_DOMAINS = ['uwo.ca', 'ivey.ca'];

export function isWesternEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  return ALLOWED_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}

export function makeDisplayName(email: string): string {
  return email
    .split('@')[0]
    .replace(/[._]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}