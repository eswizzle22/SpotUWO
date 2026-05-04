import { useMemo, useState, useCallback } from 'react';
import BuildingCard from '../components/BuildingCard';
import SpotFilters from '../components/SpotFilters';
import '../styles/SpotsPage.css';
import type { FilterType, StudySpot, StudyType, CrowdLevel } from '../types';
import {
  distanceKm,
  getStudyTypeLabel,
  getStatusEmoji,
  getStatusLabel,
  isOpenNow,
} from '../utils/helpers';

type SpotsPageProps = {
  spots: StudySpot[];
  setSelectedSpot: (spot: StudySpot | null) => void;
};

type GroupedBuilding = {
  building: string;
  spots: StudySpot[];
  crowdLevel: CrowdLevel;
  studyTypes: StudyType[];
  isOpenNow: boolean;
  lastUpdatedTimestamp: number | null;
  isEstimated: boolean;
};

function groupSpotsByBuilding(spots: StudySpot[]): GroupedBuilding[] {
  const grouped = new Map<string, StudySpot[]>();
  for (const spot of spots) {
    if (!grouped.has(spot.building)) grouped.set(spot.building, []);
    grouped.get(spot.building)!.push(spot);
  }

  return Array.from(grouped.entries()).map(([building, bSpots]) => {
    // Aggregate crowd level — worst case wins
    let crowdLevel: CrowdLevel = 'unknown';
    if (bSpots.some((s) => s.crowdLevel === 'crowded')) crowdLevel = 'crowded';
    else if (bSpots.some((s) => s.crowdLevel === 'moderate')) crowdLevel = 'moderate';
    else if (bSpots.some((s) => s.crowdLevel === 'not busy')) crowdLevel = 'not busy';

    // Most recent update across all spots in building
    const timestamps = bSpots
      .map((s) => s.lastUpdatedTimestamp)
      .filter((t): t is number => t !== null);
    const lastUpdatedTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : null;

    // Estimated if ALL spots are still estimated (i.e. no live reports)
    const isEstimated = bSpots.every((s) => s.isEstimated);

    return {
      building,
      spots: bSpots,
      crowdLevel,
      studyTypes: Array.from(new Set(bSpots.map((s) => s.studyType))),
      isOpenNow: bSpots.some((s) => isOpenNow(s)),
      lastUpdatedTimestamp,
      isEstimated,
    };
  });
}

function BuildingModal({
  building,
  spots,
  onClose,
  onSelectSpot,
}: {
  building: string;
  spots: StudySpot[];
  onClose: () => void;
  onSelectSpot: (spot: StudySpot) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl border-2 border-violet-200">
        <div className="flex items-center justify-between border-b-2 border-violet-100 px-6 py-5 bg-gradient-to-r from-violet-50 to-purple-50">
          <div>
            <h2 className="text-xl font-bold text-violet-900">{building}</h2>
            <p className="text-sm text-violet-600 mt-1 font-medium">Select a study spot</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 transition-colors"
          >
            Close
          </button>
        </div>

        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-5">
          {spots.map((spot) => (
            <button
              key={spot.id}
              onClick={() => onSelectSpot(spot)}
              className="w-full rounded-xl border-2 border-violet-100 p-4 text-left transition hover:bg-violet-50 hover:border-violet-400"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-violet-900 truncate">{spot.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {getStudyTypeLabel(spot.studyType)}
                    {spot.floor ? ` · ${spot.floor}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {getStatusEmoji(spot.crowdLevel)} {getStatusLabel(spot.crowdLevel)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {isOpenNow(spot) ? '🟢 Open' : '🔴 Closed'}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SpotsPage({ spots, setSelectedSpot }: SpotsPageProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sort, setSort] = useState<'default' | 'distance' | 'least-busy'>('default');
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const requestLocation = useCallback(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 43.0096, lng: -81.2737 }),
    );
  }, []);

  const filteredSpots = useMemo(() => {
    let result = spots;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.building.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      );
    }

    switch (filter) {
      case 'silent': result = result.filter((s) => s.studyType === 'silent'); break;
      case 'group': result = result.filter((s) => s.studyType === 'group'); break;
      case 'available': result = result.filter((s) => s.crowdLevel === 'not busy'); break;
      case 'outlets': result = result.filter((s) => s.hasOutlets === true); break;
      case 'open now': result = result.filter((s) => isOpenNow(s)); break;
      case 'near me':
        if (!userLocation) return result;
        result = [...result]
          .map((s) => ({ ...s, _dist: distanceKm(userLocation.lat, userLocation.lng, s.lat, s.lng) }))
          .sort((a, b) => (a as any)._dist - (b as any)._dist)
          .slice(0, 12);
        break;
    }
    return result;
  }, [spots, search, filter, userLocation]);

  const groupedBuildings = useMemo(() => {
    let buildings = groupSpotsByBuilding(filteredSpots);

    if (sort === 'distance' && userLocation) {
      buildings = buildings
        .map((b) => ({
          ...b,
          _avg:
            b.spots.reduce((s, sp) => s + distanceKm(userLocation.lat, userLocation.lng, sp.lat, sp.lng), 0) /
            b.spots.length,
        }))
        .sort((a, b) => (a as any)._avg - (b as any)._avg);
    } else if (sort === 'least-busy') {
      const order: Record<string, number> = { 'not busy': 0, moderate: 1, crowded: 2, unknown: 3 };
      buildings = [...buildings].sort((a, b) => order[a.crowdLevel] - order[b.crowdLevel]);
    }

    return buildings;
  }, [filteredSpots, sort, userLocation]);

  const activeBuilding = groupedBuildings.find((g) => g.building === selectedBuilding);

  return (
    <div className="space-y-5 p-5 pb-24">
      <SpotFilters
        search={search}
        onSearchChange={setSearch}
        activeFilter={filter}
        onFilterChange={(val) => {
          setFilter(val);
          if (val === 'near me' && !userLocation) requestLocation();
        }}
        sort={sort}
        onSortChange={setSort}
      />

      {groupedBuildings.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold">No spots match your filters</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      <div className="w-full">
        <div className="spots-grid-wrapper">
          {groupedBuildings.map((group) => (
            <BuildingCard
              key={group.building}
              building={group.building}
              spots={group.spots}
              crowdLevel={group.crowdLevel}
              studyTypes={group.studyTypes}
              isOpenNow={group.isOpenNow}
              lastUpdatedTimestamp={group.lastUpdatedTimestamp}
              isEstimated={group.isEstimated}
              onClick={() => setSelectedBuilding(group.building)}
            />
          ))}
        </div>
      </div>

      {activeBuilding && (
        <BuildingModal
          building={activeBuilding.building}
          spots={activeBuilding.spots}
          onClose={() => setSelectedBuilding(null)}
          onSelectSpot={(spot) => {
            setSelectedBuilding(null);
            setSelectedSpot(spot);
          }}
        />
      )}
    </div>
  );
}