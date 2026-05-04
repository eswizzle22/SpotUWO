import { useState, useCallback } from 'react';
import { List, Map, Navigation, User, ArrowLeft, Flag } from 'lucide-react';
import type { StudySpot, CrowdLevel, NoiseLevel, SeatingEstimate, Report, TabId } from './types';
import { studySpots as initialSpots } from './data/studySpots';
import buildingImages from './data/buildingImages';
import SpotsPage from './pages/SpotsPage';
import MapPage from './pages/MapPage';
import NearMePage from './pages/Nearmepage';
import ProfilePage from './pages/ProfilePage';
import AuthPage from './pages/Authpage';
import { UpdateStatusModal, VoteButtons } from './components/UpdateStatusModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import logo from "./assets/logo.png";
import {
  aggregateReports,
  getStatusEmoji,
  getStatusLabel,
  getStudyTypeLabel,
  getSeatingLabel,
  getTimeSince,
  REPORT_EXPIRY_MS,
} from './utils/helpers';
import { useAuth, useLocalStorageJSON } from './hooks/useLocalStorage';

// ─────────────────────────────────────────────
// SpotDetail
// ─────────────────────────────────────────────
function SpotDetail({
  spot,
  onBack,
  onSubmitUpdate,
  onVote,
  currentUser,
}: {
  spot: StudySpot;
  onBack: () => void;
  onSubmitUpdate: (spotId: string, crowd: CrowdLevel, noise: NoiseLevel, seating?: SeatingEstimate) => void;
  onVote: (spotId: string, reportId: string, direction: 'up' | 'down') => void;
  currentUser: NonNullable<ReturnType<typeof useAuth>['currentUser']>;
}) {
  const buildingImage = buildingImages[spot.building as keyof typeof buildingImages];
  const [imageError, setImageError] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [reported, setReported] = useState(false);

  const agg = aggregateReports(spot.reports);
  const displayCrowd = agg.recentCount > 0 ? agg.crowd : spot.crowdLevel;
  const displayNoise = agg.recentCount > 0 ? agg.noise : spot.noiseLevel;
  const displaySeating = agg.recentCount > 0 ? agg.seating : spot.seating;
  const displayEstimated = agg.recentCount === 0;
  const displayConfidence = agg.recentCount > 0 ? agg.confidence : spot.confidence;

  const freshReports = spot.reports.filter((r) => Date.now() - r.timestamp < REPORT_EXPIRY_MS);
  // Show the 3 most recent fresh reports for the voting section
  const recentReports = [...freshReports].sort((a, b) => b.timestamp - a.timestamp).slice(0, 3);

  const noiseLabel = (n: string) =>
    n === 'quiet' ? 'Quiet' : n === 'moderate' ? 'Moderate' : n === 'loud' ? 'Loud' : 'Unknown';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-violet-100 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-violet-700 font-semibold hover:bg-violet-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-5 py-6 pb-28">
        {/* Building image */}
        {buildingImage && !imageError ? (
          <div className="mb-5 rounded-2xl overflow-hidden border-2 border-violet-100 shadow-md h-52">
            <img
              src={buildingImage}
              alt={spot.building}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          </div>
        ) : (
          <div className="mb-5 rounded-2xl border-2 border-violet-100 bg-violet-50 h-52 flex items-center justify-center">
            <p className="text-5xl">🏛️</p>
          </div>
        )}

        {/* ── Status banner — crowd is HERO ── */}
        <div className="rounded-2xl border-2 border-violet-200 bg-white overflow-hidden shadow-sm mb-4">
          {/* Big crowd status strip */}
          <div
            className={`w-full px-5 py-4 flex items-center gap-3 ${displayCrowd === 'not busy'
                ? 'bg-green-500'
                : displayCrowd === 'moderate'
                  ? 'bg-amber-400'
                  : displayCrowd === 'crowded'
                    ? 'bg-red-500'
                    : 'bg-gray-400'
              }`}
          >
            <span className="text-2xl">{getStatusEmoji(displayCrowd)}</span>
            <div className="flex-1">
              <p className="text-white font-extrabold text-xl leading-tight">
                {getStatusLabel(displayCrowd)}
              </p>
              {spot.lastUpdatedTimestamp ? (
                <p className="text-white/80 text-xs font-medium">
                  Updated {getTimeSince(spot.lastUpdatedTimestamp)}
                </p>
              ) : (
                <p className="text-white/80 text-xs font-medium">Estimated · no live reports yet</p>
              )}
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold ${displayEstimated ? 'bg-white/20 text-white' : 'bg-white text-violet-700'
                }`}
            >
              {displayEstimated ? 'Est.' : 'Live'}
            </span>
          </div>

          {/* Sub-info */}
          <div className="px-5 py-4">
            <h1 className="text-xl font-bold text-violet-900">{spot.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {spot.building}{spot.floor ? ` · ${spot.floor}` : ''}
            </p>
            {freshReports.length > 0 && (
              <p className="text-xs text-violet-600 font-semibold mt-2">
                📊 {freshReports.length} report{freshReports.length !== 1 ? 's' : ''} in last 20 min
              </p>
            )}
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {([
            ['📚 Study Type', getStudyTypeLabel(spot.studyType)],
            ['🕐 Hours', spot.hours],
            ['🔌 Outlets', spot.hasOutlets ? 'Available' : spot.hasOutlets === false ? 'None' : 'Unknown'],
            ['🍕 Food', spot.foodAllowed ? 'Allowed' : spot.foodAllowed === false ? 'Not allowed' : 'Unknown'],
            ['🪑 Seating', getSeatingLabel(displaySeating)],
            ['🔊 Noise', noiseLabel(displayNoise)],
            ['📊 Confidence', displayConfidence.charAt(0).toUpperCase() + displayConfidence.slice(1)],
            ['📐 Size', spot.size.charAt(0).toUpperCase() + spot.size.slice(1)],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
              <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">{spot.description}</p>
        </div>

        {/* ── Recent reports + voting ── */}
        {recentReports.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-4 shadow-sm">
            <p className="text-sm font-bold text-gray-800 mb-3">
              🗳️ Recent reports · vote if you're here
            </p>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <div key={report.id} className="rounded-xl bg-gray-50 p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">{getStatusEmoji(report.crowd)}</span>
                    <span className="text-sm font-semibold text-gray-800">{getStatusLabel(report.crowd)}</span>
                    <span className="text-xs text-gray-400">· {noiseLabel(report.noise)} noise</span>
                  </div>
                  <VoteButtons
                    report={report}
                    currentUser={currentUser}
                    spotLat={spot.lat}
                    spotLng={spot.lng}
                    onVote={(reportId, dir) => onVote(spot.id, reportId, dir)}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-3 text-center">
              📍 You must be at this location to upvote or downvote
            </p>
          </div>
        )}

        {/* Submit update */}
        <div className="rounded-2xl border-2 border-violet-200 bg-violet-50 p-5 mb-4">
          <p className="text-sm font-bold text-violet-900 mb-1">📍 Submit a live update</p>
          <p className="text-xs text-gray-500 mb-3">
            Must be physically at this spot. Earns +5 points per verified update.
          </p>
          <button
            onClick={() => setShowUpdateModal(true)}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors active:scale-95 shadow-md"
          >
            Update Status · +5 pts
          </button>
        </div>

        {/* Report abuse */}
        {reported ? (
          <p className="text-center text-xs text-gray-400">
            <Flag className="w-3 h-3 inline mr-1" />
            Flagged for review. Thanks for keeping things accurate.
          </p>
        ) : (
          <button
            onClick={() => setReported(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            <Flag className="w-3 h-3" />
            Report suspicious update
          </button>
        )}
      </div>

      {showUpdateModal && (
        <UpdateStatusModal
          spot={spot}
          currentUser={currentUser}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={(spotId, crowd, noise, seating) => {
            onSubmitUpdate(spotId, crowd, noise, seating);
            setShowUpdateModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Bottom Nav
// ─────────────────────────────────────────────
const navTabs: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'list', label: 'Spots', icon: List },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'nearme', label: 'Near Me', icon: Navigation },
  { id: 'profile', label: 'Profile', icon: User },
];

function BottomNav({
  active,
  onChange,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
}) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg h-20">
      <div className="max-w-4xl mx-auto h-full flex items-center justify-around px-2">
        {navTabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;

          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex flex-col items-center justify-center flex-1 gap-1 py-2 transition-all duration-150 active:scale-95 ${
                isActive
                  ? "text-violet-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {/* Icon */}
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "scale-110" : ""
                }`}
              />

              {/* Label */}
              <span
                className={`text-xs font-semibold ${
                  isActive ? "text-violet-600" : ""
                }`}
              >
                {label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-violet-600 mt-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────
// App
// ─────────────────────────────────────────────
export default function App() {
  const { currentUser, signUp, signIn, signOut, updateUser } = useAuth();
  const [tab, setTab] = useState<TabId>('list');
  const [selectedSpot, setSelectedSpot] = useState<StudySpot | null>(null);
  const [spots, setSpots] = useState<StudySpot[]>(initialSpots); 
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 43.0096, lng: -81.2737 }),
    );
  }, []);

  // ── Submit update (geo already verified inside modal) ──
  const handleSubmitUpdate = useCallback(
    (spotId: string, crowd: CrowdLevel, noise: NoiseLevel, seating?: SeatingEstimate) => {
      if (!currentUser) return;

      const newReport: Report = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        crowd,
        noise,
        seating: seating ?? 'unknown',
        timestamp: Date.now(),
        upvotes: 0,
        downvotes: 0,
        submittedBy: currentUser.email,
      };

      const updatedSpots = spots.map((s) => {
        if (s.id !== spotId) return s;
        const updatedReports = [...s.reports, newReport];
        const agg = aggregateReports(updatedReports);
        return {
          ...s,
          reports: updatedReports,
          crowdLevel: agg.crowd !== 'unknown' ? agg.crowd : s.crowdLevel,
          noiseLevel: agg.noise !== 'unknown' ? agg.noise : s.noiseLevel,
          seating: agg.seating !== 'unknown' ? agg.seating : s.seating,
          isEstimated: agg.isEstimated,
          confidence: agg.confidence,
          reportsCount: s.reportsCount + 1,
          lastUpdatedTimestamp: Date.now(),
          lastUpdated: new Date().toISOString(),
        };
      });
      setSpots(updatedSpots);

      // Update user points/updates count
      updateUser({ points: currentUser.points + 5, totalUpdates: currentUser.totalUpdates + 1 });

      // Keep selected spot in sync
      if (selectedSpot?.id === spotId) {
        setSelectedSpot((prev) =>
          prev ? { ...prev, reports: [...prev.reports, newReport], crowdLevel: crowd, noiseLevel: noise, isEstimated: false, lastUpdatedTimestamp: Date.now() } : null,
        );
      }
    },
    [spots, currentUser, selectedSpot, setSpots, updateUser],
  );

  // ── Vote on a report (geo already verified inside VoteButtons) ──
  const handleVote = useCallback(
    (spotId: string, reportId: string, direction: 'up' | 'down') => {
      if (!currentUser) return;
      if (currentUser.votedReports.includes(reportId)) return;

      const updatedSpots = spots.map((s) => {
        if (s.id !== spotId) return s;
        return {
          ...s,
          reports: s.reports.map((r) => {
            if (r.id !== reportId) return r;
            return {
              ...r,
              upvotes: direction === 'up' ? r.upvotes + 1 : r.upvotes,
              downvotes: direction === 'down' ? r.downvotes + 1 : r.downvotes,
            };
          }),
        };
      });
      setSpots(updatedSpots);

      // Mark this report as voted by user so they can't double-vote
      updateUser({ votedReports: [...currentUser.votedReports, reportId] });

      // Keep selected spot in sync
      if (selectedSpot?.id === spotId) {
        setSelectedSpot((prev) =>
          prev
            ? {
              ...prev,
              reports: prev.reports.map((r) =>
                r.id !== reportId
                  ? r
                  : {
                    ...r,
                    upvotes: direction === 'up' ? r.upvotes + 1 : r.upvotes,
                    downvotes: direction === 'down' ? r.downvotes + 1 : r.downvotes,
                  },
              ),
            }
            : null,
        );
      }
    },
    [spots, currentUser, selectedSpot, setSpots, updateUser],
  );

  // ── Auth gate ──
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <AuthPage onSignUp={signUp} onSignIn={signIn} />
      </ErrorBoundary>
    );
  }

  // ── Spot detail view ──
  if (selectedSpot) {
    return (
      <ErrorBoundary>
        <SpotDetail
          spot={selectedSpot}
          onBack={() => setSelectedSpot(null)}
          onSubmitUpdate={handleSubmitUpdate}
          onVote={handleVote}
          currentUser={currentUser}
        />
      </ErrorBoundary>
    );
  }

  // ── Main app ──
  return (
  <ErrorBoundary>
  <div className="min-h-screen bg-gray-50">
    {/* Header */}
    <header className="sticky top-0 z-30 bg-white border-b border-violet-100 shadow-sm">
      <div className="max-w-8xl mx-auto flex items-left justify-between px-5 py-5">

        {/* Logo + Title */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Spot@UWO logo"
            className="w-15 h-15 object-contain"
          />
          <h1 className="text-4xl font-bold text-violet-900">
            Spot<span className="text-violet-500">UWO</span>
          </h1>
        </div>

        {/* Points */}
        <div className="flex items-center gap-2 bg-violet-50 rounded-full px-3 py-1.5 border border-violet-200">
          <span className="text-sm font-bold text-violet-700">
            🏆 {currentUser.points} pts
          </span>
        </div>

      </div>
    </header>

        <main>
          {tab === 'list' && (
            <SpotsPage spots={spots} setSelectedSpot={setSelectedSpot} />
          )}
          {tab === 'map' && (
            <MapPage
              spots={spots}
              onSpotSelect={setSelectedSpot}
              userLocation={userLocation}
              onRequestLocation={requestLocation}
            />
          )}
          {tab === 'nearme' && (
            <NearMePage
              spots={spots}
              userLocation={userLocation}
              onRequestLocation={requestLocation}
              onSpotSelect={setSelectedSpot}
            />
          )}
          {tab === 'profile' && (
            <ProfilePage currentUser={currentUser} onSignOut={signOut} />
          )}
        </main>

        <BottomNav active={tab} onChange={setTab} />
      </div>
    </ErrorBoundary>
  );
}