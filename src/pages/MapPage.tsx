import { useEffect, useMemo, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StudySpot } from '../types';
import { getStatusHex, getStatusEmoji } from '../utils/helpers';

interface MapPageProps {
    spots: StudySpot[];
    onSpotSelect: (spot: StudySpot) => void;
    userLocation: { lat: number; lng: number } | null;
    onRequestLocation: () => void;
}
type BuildingGroup = {
    building: string;
    code: string;
    lat: number;
    lng: number;
    spots: StudySpot[];
    crowdLevel: StudySpot['crowdLevel'];
};

export default function MapPage({
    spots,
    onSpotSelect,
    userLocation,
    onRequestLocation,
}: MapPageProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    const [selectedBuilding, setSelectedBuilding] = useState<BuildingGroup | null>(null);

    const groupedBuildings = useMemo<BuildingGroup[]>(() => {
    const getOverallCrowdLevel = (buildingSpots: StudySpot[]): StudySpot['crowdLevel'] => {
        const levels = buildingSpots.map((s) => s.crowdLevel);

        if (levels.includes('crowded')) return 'crowded';
        if (levels.includes('moderate')) return 'moderate';
        if (levels.includes('not busy')) return 'not busy';
        return 'unknown';
    };

    const grouped = spots.reduce<Record<string, Omit<BuildingGroup, 'crowdLevel'>>>((acc, spot) => {
        if (!acc[spot.building]) {
            acc[spot.building] = {
                building: spot.building,
                code: spot.code,
                lat: spot.lat,
                lng: spot.lng,
                spots: [],
            };
        }

        acc[spot.building].spots.push(spot);
        return acc;
    }, {});

    return Object.values(grouped).map((building) => ({
        ...building,
        crowdLevel: getOverallCrowdLevel(building.spots),
    }));
}, [spots]);

    // Init map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return;

        const map = L.map(mapRef.current, {
            center: [43.0093, -81.2738],
            zoom: 16,
            zoomControl: false,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
        }).addTo(map);

        markersLayerRef.current = L.layerGroup().addTo(map);
        mapInstance.current = map;

        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        return () => {
            map.remove();
            mapInstance.current = null;
            markersLayerRef.current = null;
        };
    }, []);

    // Update markers when grouped buildings or userLocation change
    useEffect(() => {
        const map = mapInstance.current;
        const markersLayer = markersLayerRef.current;
        if (!map || !markersLayer) return;

        markersLayer.clearLayers();

        // One marker per building
        groupedBuildings.forEach((building) => {
            const color = getStatusHex(building.crowdLevel);
            const emoji = getStatusEmoji(building.crowdLevel);

            const icon = L.divIcon({
                className: '',
                html: `<div style="
                    width:40px;
                    height:40px;
                    border-radius:50%;
                    background:${color};
                    border:3px solid white;
                    box-shadow:0 2px 8px rgba(0,0,0,0.3);
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-size:14px;
                    font-weight:700;
                    cursor:pointer;
                ">${emoji}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20],
            });

            const marker = L.marker([building.lat, building.lng], { icon });

            marker.bindTooltip(
                `<div style="font-weight:700">${building.code} · ${building.building}</div>
                 <div style="font-size:12px">${building.spots.length} study spot${building.spots.length === 1 ? '' : 's'}</div>`,
                { direction: 'top', offset: [0, -18] }
            );

            marker.on('click', () => {
                setSelectedBuilding(building);
            });

            markersLayer.addLayer(marker);
        });

        // Add user location marker
        if (userLocation) {
            const userIcon = L.divIcon({
                className: '',
                html: `<div style="
                    width:16px;
                    height:16px;
                    border-radius:50%;
                    background:#7c3aed;
                    border:3px solid white;
                    box-shadow:0 0 0 5px rgba(124,58,237,0.25),0 2px 8px rgba(0,0,0,0.2);
                "></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });

            const userMarker = L.marker([userLocation.lat, userLocation.lng], {
                icon: userIcon,
            });

            markersLayer.addLayer(userMarker);
        }
    }, [groupedBuildings, userLocation, onSpotSelect]);

    const handleCenterOnUser = () => {
        if (userLocation && mapInstance.current) {
            mapInstance.current.setView([userLocation.lat, userLocation.lng], 17);
        }
    };

    return (
        <div className="relative w-full pb-10" style={{ height: 'calc(100vh - 140px)' }}>
            <div ref={mapRef} className="w-full h-full rounded-t-xl" />

            {/* Legend */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-md border border-gray-200 flex gap-3 text-[11px] font-semibold text-gray-700">
                <span>🟢 Quiet</span>
                <span>🟡 Moderate</span>
                <span>🔴 Crowded</span>
                <span>⚪ Unknown</span>
            </div>

            {selectedBuilding && (
    <div className="absolute left-3 right-3 bottom-24 z-[1000] bg-white rounded-2xl shadow-xl border border-gray-200 p-4 max-h-[40vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-3">
            <div>
                <h3 className="text-base font-bold text-violet-900">
                    {selectedBuilding.building}
                </h3>
                <p className="text-xs text-gray-500">
                    {selectedBuilding.spots.length} study spot{selectedBuilding.spots.length === 1 ? '' : 's'} available
                </p>
            </div>

            <button
                onClick={() => setSelectedBuilding(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
            >
                ✕
            </button>
        </div>

        <div className="space-y-2">
            {selectedBuilding.spots.map((spot) => (
                <button
                    key={spot.id}
                    onClick={() => {
                        onSpotSelect(spot);
                        setSelectedBuilding(null);
                    }}
                    className="w-full text-left rounded-xl border border-violet-100 bg-violet-50 hover:bg-violet-100 px-4 py-3 transition-colors"
                >
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="font-semibold text-sm text-violet-900">
                                {spot.name}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {spot.floor ? `${spot.floor} · ` : ''}
                                {spot.studyType} · {spot.noiseLevel}
                            </div>
                        </div>

                        <div className="text-sm font-semibold text-gray-600">
                            {getStatusEmoji(spot.crowdLevel)}
                        </div>
                    </div>
                </button>
            ))}
        </div>
    </div>
)}

            {/* Near me / center button */}
            <button
                onClick={userLocation ? handleCenterOnUser : onRequestLocation}
                className="absolute bottom-24 right-4 z-[1000] bg-violet-600 hover:bg-violet-700 text-white rounded-full px-4 py-2.5 text-sm font-bold shadow-lg flex items-center gap-2 transition-colors active:scale-95"
            >
                📍 {userLocation ? 'Center on me' : 'Near me'}
            </button>
        </div>
    );
}