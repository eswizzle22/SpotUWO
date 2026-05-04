import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertTriangle,
  Armchair,
  ArrowLeft,
  Award,
  BarChart3,
  Clock,
  Compass,
  Flag,
  List,
  Map,
  MapPin,
  Navigation,
  Plug,
  Search,
  Send,
  ShieldCheck,
  Star,
  ThumbsDown,
  ThumbsUp,
  Trophy,
  User,
  UtensilsCrossed,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CrowdLevel, NoiseLevel, SeatingEstimate, StudySpot } from '../types';
import {
  distanceKm,
  getReputationLevel,
  getSeatingLabel,
  getStatusColor,
  getStatusEmoji,
  getStatusHex,
  getStatusLabel,
  getStudyTypeLabel,
  getTimeSince,
  REPORT_EXPIRY_MS,
  walkingMinutes,
} from '../utils/helpers';

// ──────────────── Header ────────────────
export function Header({ points = 0 }: { points?: number }) {
  return (
    <header className="sticky top-0 z-50 bg-[hsl(var(--surface-elevated))]/95 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="leading-none">
            <h1 className="text-base font-bold tracking-tight text-foreground">
              Spot<span className="text-primary">@UWO</span>
            </h1>
          </div>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold transition-transform active:scale-95">
          <Trophy className="w-3.5 h-3.5" />
          {points} pts
        </button>
      </div>
    </header>
  );
}

// ──────────────── SpotCard ────────────────
interface SpotCardProps {
  spot: StudySpot;
  onClick: () => void;
  delay?: number;
}

export function SpotCard({ spot, onClick, delay = 0 }: SpotCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left card-elevated p-4 transition-all duration-200 active:scale-[0.97] animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getStatusColor(spot.crowdLevel)}`} />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {getStatusLabel(spot.crowdLevel)}
              {spot.isEstimated && ' · Est.'}
            </span>
          </div>
          <h3 className="font-semibold text-foreground text-[15px] leading-snug truncate">{spot.name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{spot.building}</p>
        </div>
        <span className="shrink-0 px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-[11px] font-bold uppercase tracking-wider">
          {spot.code}
        </span>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3" />
          {getStudyTypeLabel(spot.studyType)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {spot.hours.split('–')[0].trim()}
        </span>
        {spot.hasOutlets && (
          <span className="flex items-center gap-1">
            <Plug className="w-3 h-3" />
            Outlets
          </span>
        )}
      </div>
    </button>
  );
}

// ──────────────── SpotFilters ────────────────
export type FilterType = 'all' | 'silent' | 'group' | 'available' | 'outlets';

const filters: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All Spots' },
  { key: 'available', label: '🟢 Available' },
  { key: 'silent', label: '🤫 Silent' },
  { key: 'group', label: '👥 Group' },
  { key: 'outlets', label: '🔌 Outlets' },
];

interface SpotFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  activeFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
}

export function SpotFilters({ search, onSearchChange, activeFilter, onFilterChange }: SpotFiltersProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" />
        <input
          type="text"
          placeholder="Search buildings or spots..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-lg bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all shadow-sm font-medium"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => onFilterChange(f.key)}
            className={`shrink-0 px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
              activeFilter === f.key
                ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-lg hover:from-violet-600 hover:to-violet-800 hover:shadow-xl'
                : 'bg-white text-gray-800 border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ──────────────── QuickUpdate ────────────────
interface QuickUpdateProps {
  spotId: string;
  onSubmit: (spotId: string, crowd: CrowdLevel, noise: NoiseLevel, seating?: SeatingEstimate) => void;
}

function QuickUpdate({ spotId, onSubmit }: QuickUpdateProps) {
  const [crowd, setCrowd] = useState<CrowdLevel | null>(null);
  const [noise, setNoise] = useState<NoiseLevel | null>(null);
  const [seating, setSeating] = useState<SeatingEstimate | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!crowd || !noise) return;
    onSubmit(spotId, crowd, noise, seating || undefined);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (submitted) {
    return (
      <div className="card-elevated p-5 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="text-sm font-semibold text-foreground">Thanks! +5 points</p>
        <p className="text-xs text-muted-foreground mt-1">Your update helps other students</p>
      </div>
    );
  }

  return (
    <div className="card-elevated p-4">
      <p className="text-sm font-semibold text-foreground mb-3">📍 Submit an update</p>
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-3 font-bold uppercase tracking-wide">How crowded is it?</p>
        <div className="flex gap-2">
          {(
            [
              ['not busy', '🟢 Quiet'],
              ['moderate', '🟡 Moderate'],
              ['crowded', '🔴 Crowded'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setCrowd(val)}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                crowd === val
                  ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-md hover:from-violet-600 hover:to-violet-800 hover:shadow-lg'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <p className="text-xs text-gray-600 mb-3 font-bold uppercase tracking-wide">Noise level?</p>
        <div className="flex gap-2">
          {(
            [
              ['quiet', '🤫 Quiet'],
              ['moderate', '💬 Medium'],
              ['loud', '📢 Loud'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setNoise(val)}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                noise === val
                  ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-md hover:from-violet-600 hover:to-violet-800 hover:shadow-lg'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-3 font-bold uppercase tracking-wide">Seating available? (optional)</p>
        <div className="flex gap-2">
          {(
            [
              ['few', 'Few seats'],
              ['some', 'Some seats'],
              ['many', 'Many seats'],
            ] as const
          ).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setSeating(seating === val ? null : val)}
              className={`flex-1 py-3 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                seating === val
                  ? 'bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-md hover:from-violet-600 hover:to-violet-800 hover:shadow-lg'
                  : 'bg-gray-100 text-gray-800 border-2 border-gray-300 hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <button
        onClick={handleSubmit}
        disabled={!crowd || !noise}
        className="w-full py-3 rounded-lg bg-gradient-to-b from-violet-500 to-violet-700 hover:from-violet-600 hover:to-violet-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
      >
        <Send className="w-4 h-4" />
        Submit Update
      </button>
    </div>
  );
}

// ──────────────── SpotDetail ────────────────
interface SpotDetailProps {
  spot: StudySpot;
  onBack: () => void;
  onUpdate: (spotId: string, crowd: CrowdLevel, noise: NoiseLevel, seating?: SeatingEstimate) => void;
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-elevated p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SpotDetail({ spot, onBack, onUpdate }: SpotDetailProps) {
  const [voted, setVoted] = useState<'accurate' | 'inaccurate' | null>(null);
  const [reported, setReported] = useState(false);
  const freshReports = spot.reports.filter((r) => Date.now() - r.timestamp < REPORT_EXPIRY_MS);
  const recentCount = freshReports.length;

  return (
    <div className="animate-fade-in">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <div className="card-elevated p-5 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className={`w-3 h-3 rounded-full ${getStatusColor(spot.crowdLevel)}`} />
          <span className="text-sm font-bold">
            {getStatusEmoji(spot.crowdLevel)} {getStatusLabel(spot.crowdLevel)}
          </span>
          <span
            className={`ml-auto text-[11px] px-2 py-0.5 rounded-full font-medium ${
              spot.isEstimated ? 'bg-secondary text-muted-foreground' : 'bg-primary/10 text-primary'
            }`}
          >
            {spot.isEstimated ? 'Estimated' : 'Live'}
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground leading-tight">{spot.name}</h2>
        <p className="text-sm text-muted-foreground mt-1">{spot.building}</p>
        {spot.lastUpdatedTimestamp && (
          <p className="text-xs text-muted-foreground mt-2">Updated {getTimeSince(spot.lastUpdatedTimestamp)}</p>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <InfoTile icon={<Volume2 className="w-4 h-4" />} label="Study Type" value={getStudyTypeLabel(spot.studyType)} />
        <InfoTile icon={<Clock className="w-4 h-4" />} label="Hours" value={spot.hours} />
        <InfoTile
          icon={<Plug className="w-4 h-4" />}
          label="Outlets"
          value={spot.hasOutlets ? 'Available' : spot.hasOutlets === false ? 'None' : 'Unknown'}
        />
        <InfoTile
          icon={<UtensilsCrossed className="w-4 h-4" />}
          label="Food"
          value={spot.foodAllowed ? 'Allowed' : spot.foodAllowed === false ? 'Not allowed' : 'Unknown'}
        />
        <InfoTile icon={<Armchair className="w-4 h-4" />} label="Seating" value={getSeatingLabel(spot.seating)} />
        <InfoTile
          icon={<ShieldCheck className="w-4 h-4" />}
          label="Confidence"
          value={spot.confidence.charAt(0).toUpperCase() + spot.confidence.slice(1)}
        />
        <InfoTile
          icon={<MapPin className="w-4 h-4" />}
          label="Size"
          value={spot.size.charAt(0).toUpperCase() + spot.size.slice(1)}
        />
        {spot.floor && <InfoTile icon={<MapPin className="w-4 h-4" />} label="Floor" value={spot.floor} />}
      </div>
      <div className="card-elevated p-4 mb-4">
        <p className="text-sm text-foreground leading-relaxed">{spot.description}</p>
        {recentCount > 0 && (
          <p className="text-xs text-primary font-medium mt-2">
            📊 {recentCount} report{recentCount !== 1 ? 's' : ''} in last 20 min
          </p>
        )}
      </div>
      <div className="card-elevated p-4 mb-4">
        <p className="text-sm font-semibold text-foreground mb-3">Is this accurate?</p>
        <div className="flex gap-2">
          <button
            onClick={() => setVoted('accurate')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              voted === 'accurate'
                ? 'bg-[hsl(var(--status-available))]/15 text-status-available border border-[hsl(var(--status-available))]/30'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> Accurate
          </button>
          <button
            onClick={() => setVoted('inaccurate')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
              voted === 'inaccurate'
                ? 'bg-destructive/15 text-destructive border border-destructive/30'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> Not accurate
          </button>
        </div>
      </div>
      <QuickUpdate spotId={spot.id} onSubmit={onUpdate} />
      <div className="mt-4 mb-8">
        {reported ? (
          <p className="text-center text-xs text-muted-foreground">
            <AlertTriangle className="w-3 h-3 inline mr-1" />
            Flagged for review. Thanks for keeping things accurate.
          </p>
        ) : (
          <button
            onClick={() => setReported(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-destructive transition-colors active:scale-95"
          >
            <Flag className="w-3 h-3" />
            Report suspicious update
          </button>
        )}
      </div>
    </div>
  );
}

// ──────────────── CampusMap ────────────────
interface CampusMapProps {
  spots: StudySpot[];
  onSpotSelect: (spot: StudySpot) => void;
  userLocation: { lat: number; lng: number } | null;
}

export function CampusMap({ spots, onSpotSelect, userLocation }: CampusMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const map = L.map(mapRef.current, { center: [43.0093, -81.2738], zoom: 16, zoomControl: false });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapInstance.current = map;
    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker || layer instanceof L.CircleMarker) map.removeLayer(layer);
    });
    spots.forEach((spot) => {
      const color = getStatusHex(spot.crowdLevel);
      const emoji = getStatusEmoji(spot.crowdLevel);
      const icon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="width:32px;height:32px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer">${emoji}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      const marker = L.marker([spot.lat, spot.lng], { icon }).addTo(map);
      marker.bindTooltip(`<strong>${spot.code}</strong><br/>${spot.name}`, { direction: 'top', offset: [0, -16] });
      marker.on('click', () => onSpotSelect(spot));
    });
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-pin',
        html: `<div style="width:16px;height:16px;border-radius:50%;background:hsl(270,50%,37%);border:3px solid white;box-shadow:0 0 0 4px rgba(89,48,139,0.25),0 2px 8px rgba(0,0,0,0.2)"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }
  }, [spots, onSpotSelect, userLocation]);

  const handleCenterOnUser = () => {
    if (userLocation && mapInstance.current) mapInstance.current.setView([userLocation.lat, userLocation.lng], 17);
  };

  return (
    <div className="relative w-full animate-fade-in" style={{ height: 'calc(100vh - 120px)' }}>
      <div ref={mapRef} className="w-full h-full rounded-2xl overflow-hidden" />
      {userLocation && (
        <button
          onClick={handleCenterOnUser}
          className="absolute bottom-20 right-3 z-[1000] w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform text-lg"
          title="Center on my location"
        >
          📍
        </button>
      )}
      <div className="absolute top-3 left-3 z-[1000] card-elevated px-3 py-2 flex gap-3 text-[11px] font-medium">
        <span>🟢 Available</span>
        <span>🟡 Moderate</span>
        <span>🔴 Crowded</span>
        <span>⚪ Unknown</span>
      </div>
    </div>
  );
}

// ──────────────── NearMe ────────────────
interface NearMeProps {
  spots: StudySpot[];
  userLocation: { lat: number; lng: number } | null;
  onRequestLocation: () => void;
  onSpotSelect: (spot: StudySpot) => void;
  preferredType: 'all' | 'silent' | 'group';
  onPreferenceChange: (p: 'all' | 'silent' | 'group') => void;
}

export function NearMe({
  spots,
  userLocation,
  onRequestLocation,
  onSpotSelect,
  preferredType,
  onPreferenceChange,
}: NearMeProps) {
  const ranked = useMemo(() => {
    if (!userLocation) return [];
    let filtered = spots;
    if (preferredType === 'silent') filtered = spots.filter((s) => s.studyType === 'silent');
    if (preferredType === 'group') filtered = spots.filter((s) => s.studyType === 'group');
    return filtered
      .map((s) => ({
        spot: s,
        distance: distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng),
        minutes: walkingMinutes(distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng)),
      }))
      .filter((s) => s.spot.crowdLevel !== 'crowded')
      .sort((a, b) => {
        const crowdScore = (l: string) => (l === 'quiet' ? 0 : l === 'moderate' ? 1 : 2);
        const confScore = (c: string) => (c === 'high' ? 0 : c === 'medium' ? 1 : 2);
        const scoreA = a.distance * 2 + crowdScore(a.spot.crowdLevel) * 0.5 + confScore(a.spot.confidence) * 0.3;
        const scoreB = b.distance * 2 + crowdScore(b.spot.crowdLevel) * 0.5 + confScore(b.spot.confidence) * 0.3;
        return scoreA - scoreB;
      })
      .slice(0, 8);
  }, [spots, userLocation, preferredType]);

  if (!userLocation) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <Compass className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Find spots near you</h3>
        <p className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto">
          Enable location to get personalized study spot recommendations based on distance and availability.
        </p>
        <button
          onClick={onRequestLocation}
          className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform"
        >
          <Navigation className="w-4 h-4 inline mr-2" />
          Enable Location
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h3 className="text-lg font-bold text-foreground mb-1">Best spots near you</h3>
      <p className="text-xs text-muted-foreground mb-4">Ranked by distance, availability & confidence</p>
      <div className="flex gap-2 mb-4">
        {(['all', 'silent', 'group'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onPreferenceChange(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
              preferredType === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {t === 'all' ? 'All' : t === 'silent' ? '🤫 Silent' : '👥 Group'}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {ranked.map(({ spot, minutes }, i) => (
          <button
            key={spot.id}
            onClick={() => onSpotSelect(spot)}
            className="w-full text-left card-elevated p-4 transition-all active:scale-[0.97] animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm">{getStatusEmoji(spot.crowdLevel)}</span>
                  <span className="text-[13px] font-semibold text-foreground truncate">{spot.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getStatusLabel(spot.crowdLevel)}</span>
                  <span>·</span>
                  <span>{getStudyTypeLabel(spot.studyType)}</span>
                  <span>·</span>
                  <span className="capitalize">{spot.confidence} confidence</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-bold text-primary">{minutes} min</p>
                <p className="text-[11px] text-muted-foreground">walk</p>
              </div>
            </div>
          </button>
        ))}
        {ranked.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">No matching spots found nearby</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────── ProfilePage ────────────────
interface ProfilePageProps {
  points: number;
  totalUpdates: number;
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-elevated p-3 text-center">
      <div className="flex justify-center text-primary mb-1">{icon}</div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function PointRow({ action, points }: { action: string; points: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{action}</span>
      <span className="font-bold text-primary">{points}</span>
    </div>
  );
}

export function ProfilePage({ points, totalUpdates }: ProfilePageProps) {
  const rep = getReputationLevel(points);
  const nextLevel = points < 10 ? 10 : points < 30 ? 30 : points < 60 ? 60 : null;
  const progress = nextLevel ? (points / nextLevel) * 100 : 100;
  const levels = [
    { min: 0, label: 'New User', badge: '🌱', weight: '1x' },
    { min: 10, label: 'Regular', badge: '🎯', weight: '1.5x' },
    { min: 30, label: 'Trusted', badge: '⭐', weight: '2x' },
    { min: 60, label: 'Campus Expert', badge: '🏆', weight: '3x' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="card-elevated p-6 text-center mb-4">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 text-4xl">
          {rep.badge}
        </div>
        <h3 className="text-xl font-bold text-foreground">{rep.label}</h3>
        <p className="text-sm text-muted-foreground mt-1">Trust weight: {rep.weight}x</p>
        {nextLevel && (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>{points} pts</span>
              <span>{nextLevel} pts</span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard icon={<Star className="w-4 h-4" />} label="Points" value={String(points)} />
        <StatCard icon={<Send className="w-4 h-4" />} label="Updates" value={String(totalUpdates)} />
        <StatCard icon={<Award className="w-4 h-4" />} label="Weight" value={`${rep.weight}x`} />
      </div>
      <div className="card-elevated p-4 mb-4">
        <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          How points work
        </h4>
        <div className="space-y-2 text-xs">
          <PointRow action="Submit a crowd update" points="+5" />
          <PointRow action="Your update confirmed accurate" points="+3" />
          <PointRow action="Consistent helpful updates" points="+2" />
        </div>
      </div>
      <div className="card-elevated p-4">
        <h4 className="text-sm font-semibold text-foreground mb-3">Reputation Levels</h4>
        <div className="space-y-2">
          {levels.map((l) => (
            <div
              key={l.label}
              className={`flex items-center justify-between p-2.5 rounded-xl text-sm ${
                rep.label === l.label ? 'bg-primary/10 border border-primary/20' : 'bg-secondary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{l.badge}</span>
                <div>
                  <p className="font-semibold text-foreground text-xs">{l.label}</p>
                  <p className="text-[11px] text-muted-foreground">{l.min}+ points</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">{l.weight} weight</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ──────────────── BottomNav ────────────────
export type TabId = 'list' | 'map' | 'nearme' | 'profile';

interface BottomNavProps {
  active: TabId;
  onChange: (tab: TabId) => void;
}

const navTabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'list', label: 'Spots', icon: List },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'nearme', label: 'Near Me', icon: Navigation },
  { id: 'profile', label: 'Profile', icon: User },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--surface-elevated))]/95 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto flex">
        {navTabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors active:scale-95 ${
              active === id ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-semibold">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
