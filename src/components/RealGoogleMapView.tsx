import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TOP_MOVING_CORRIDORS } from '../data/mockData';
import { CorridorMovement } from '../types';
import { AIRPORT_MAP_COORDINATES } from '../data/indiaMapPaths';
import { Layers, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RealGoogleMapViewProps {
  activeCorridorCode: string;
  corridors?: CorridorMovement[];
  onSelectCorridor: (corridor: CorridorMovement) => void;
}

export const RealGoogleMapView: React.FC<RealGoogleMapViewProps> = ({
  activeCorridorCode,
  corridors,
  onSelectCorridor,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [mapType, setMapType] = useState<'streets' | 'satellite' | 'dark'>('streets');

  // Tile Providers
  const TILE_URLS = {
    streets: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  };

  const ATTRIBUTIONS = {
    streets: '&copy; Google Maps Platform',
    satellite: '&copy; Google Imagery &copy; Maxar Technologies',
    dark: '&copy; OpenStreetMap & CartoDB',
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Bounds around Republic of India
    const indiaBounds = L.latLngBounds(
      [6.5, 68.0], // South-West (Lakshadweep / Kanyakumari)
      [37.5, 97.5]  // North-East (Ladakh / Arunachal Pradesh)
    );

    const map = L.map(mapContainerRef.current, {
      center: [22.8, 79.8],
      zoom: 4.8,
      minZoom: 4,
      maxZoom: 12,
      maxBounds: L.latLngBounds([4.0, 64.0], [40.0, 102.0]),
      maxBoundsViscosity: 0.8,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const initialTile = L.tileLayer(TILE_URLS[mapType], {
      attribution: ATTRIBUTIONS[mapType],
      maxZoom: 18,
    }).addTo(map);

    tileLayerRef.current = initialTile;
    const layers = L.layerGroup().addTo(map);
    layerGroupRef.current = layers;
    mapInstanceRef.current = map;

    // Fix leaflet resize in flex/grid
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when mapType changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newTile = L.tileLayer(TILE_URLS[mapType], {
      attribution: ATTRIBUTIONS[mapType],
      maxZoom: 18,
      subdomains: mapType === 'dark' ? 'abcd' : 'abc',
    }).addTo(map);

    tileLayerRef.current = newTile;
  }, [mapType]);

  // Render Routes and Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Flight Corridor Arcs (Geodesic Quad Bezier points)
    const activeCorridors = corridors && corridors.length > 0 ? corridors : TOP_MOVING_CORRIDORS;
    activeCorridors.forEach((corridor) => {
      const [origCode, destCode] = corridor.routeCode.split('-');
      const orig = AIRPORT_MAP_COORDINATES[origCode];
      const dest = AIRPORT_MAP_COORDINATES[destCode];
      if (!orig || !dest) return;

      const isSelected = corridor.routeCode === activeCorridorCode;
      const isSurge = corridor.changePct >= 15;
      const color = isSelected
        ? '#0284c7'
        : isSurge
        ? '#ef4444'
        : corridor.changePct >= 5
        ? '#f97316'
        : corridor.changePct < 0
        ? '#10b981'
        : '#3b82f6';

      // Compute curved bezier points
      const points: [number, number][] = [];
      const numSegments = 30;
      const dLat = dest.lat - orig.lat;
      const dLng = dest.lng - orig.lng;
      const dist = Math.sqrt(dLat * dLat + dLng * dLng);

      // Normal vector offset for curve
      const offsetFactor = Math.min(2.5, dist * 0.12);
      const midLat = (orig.lat + dest.lat) / 2 + (-dLng / dist) * offsetFactor;
      const midLng = (orig.lng + dest.lng) / 2 + (dLat / dist) * offsetFactor;

      for (let i = 0; i <= numSegments; i++) {
        const t = i / numSegments;
        const invT = 1 - t;
        const lat = invT * invT * orig.lat + 2 * invT * t * midLat + t * t * dest.lat;
        const lng = invT * invT * orig.lng + 2 * invT * t * midLng + t * t * dest.lng;
        points.push([lat, lng]);
      }

      // Route Glow Outline (selection)
      if (isSelected) {
        L.polyline(points, {
          color: '#38bdf8',
          weight: 9,
          opacity: 0.65,
          lineCap: 'round',
        }).addTo(layerGroup);
      }

      // Interactive Polyline
      const poly = L.polyline(points, {
        color: color,
        weight: isSelected ? 5 : isSurge ? 3.5 : 2.5,
        opacity: isSelected ? 1 : 0.85,
        dashArray: !isSelected && isSurge ? '6, 4' : undefined,
      }).addTo(layerGroup);

      if (isSelected) {
        poly.bringToFront();
      }

      poly.on('click', () => {
        onSelectCorridor(corridor);
      });

      // Hover Tooltip
      poly.bindTooltip(
        `<div class="text-xs font-sans font-bold">
          <span class="text-slate-900">${corridor.originCity} ➔ ${corridor.destCity}</span><br/>
          <span class="${isSurge ? 'text-red-600' : 'text-emerald-600'}">₹${corridor.currentFare.toLocaleString('en-IN')} (${corridor.changePct > 0 ? '+' : ''}${corridor.changePct}%)</span>
        </div>`,
        { sticky: true, className: 'leaflet-custom-tooltip' }
      );
    });

    // 2. Draw Airport Markers
    Object.entries(AIRPORT_MAP_COORDINATES).forEach(([code, coord]) => {
      const isConnected = activeCorridorCode.includes(code);

      const iconHtml = `
        <div class="flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          <div class="relative flex items-center justify-center">
            ${isConnected ? '<span class="absolute -inset-1.5 rounded-full bg-sky-400 opacity-75 animate-ping"></span>' : ''}
            <div class="relative w-8 h-8 rounded-full ${isConnected ? 'bg-sky-600 ring-2 ring-white shadow-lg' : 'bg-slate-900/90 ring-1 ring-slate-700'} flex items-center justify-center text-white text-[11px] font-black font-mono shadow-md transition-transform group-hover:scale-110">
              ${code}
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-airport-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([coord.lat, coord.lng], { icon: customIcon }).addTo(layerGroup);
      marker.bindTooltip(`<strong>${code} Airport</strong><br/>Lat: ${coord.lat.toFixed(4)}, Lng: ${coord.lng.toFixed(4)}`, {
        direction: 'top',
        offset: [0, -12],
      });
    });
  }, [activeCorridorCode, onSelectCorridor, corridors]);

  const resetView = () => {
    mapInstanceRef.current?.setView([22.8, 79.8], 4.8);
  };

  return (
    <div className="relative w-full h-[460px] rounded-xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950">
      {/* Map Target */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top Map Type Switcher Controls */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-lg border border-slate-700 shadow-md">
        <button
          type="button"
          onClick={() => setMapType('streets')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            mapType === 'streets'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Google Street
        </button>
        <button
          type="button"
          onClick={() => setMapType('satellite')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            mapType === 'satellite'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Satellite
        </button>
        <button
          type="button"
          onClick={() => setMapType('dark')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            mapType === 'dark'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          Dark Radar
        </button>
      </div>

      {/* Reset View Button */}
      <div className="absolute top-3 right-3 z-10">
        <button
          type="button"
          onClick={resetView}
          className="p-1.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white rounded-lg border border-slate-700 shadow-md flex items-center gap-1.5 text-xs font-medium transition-colors"
          title="Reset to India Overview"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span className="hidden sm:inline">Recenter India</span>
        </button>
      </div>

      {/* Bottom Compliance & Grounding Overlay */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 px-2.5 py-1 bg-slate-950/85 backdrop-blur-md rounded-md border border-slate-800 text-[11px] text-slate-300">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Geospatial Alignment: <strong>Google Maps Grounded</strong></span>
      </div>
    </div>
  );
};
