"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Station {
  id: number;
  no: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voting_area: string | null;
  accessibility: string | null;
  type: "polling" | "poster" | "early";
}

interface CityConfig {
  city: string;
  label: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  boundaryFile: string;
}

interface Props {
  stations: Station[];
  selectedStation: Station | null;
  onSelectStation: (s: Station) => void;
  cityConfig: CityConfig;
}

function createMarkerIcon(type: "polling" | "poster" | "early", no: number, isSelected: boolean) {
  const color = type === "polling" ? "#2563eb" : type === "early" ? "#10b981" : "#f97316";
  const size = isSelected ? 32 : 26;
  const fontSize = isSelected ? 12 : 10;
  const borderWidth = isSelected ? 3 : 2;

  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border:${borderWidth}px solid white;
      border-radius:8px;
      display:flex;align-items:center;justify-content:center;
      color:white;font-weight:700;font-size:${fontSize}px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transition:all 0.15s;
      font-family:Inter,sans-serif;
    ">${no}</div>`,
  });
}

/** 境界GeoJSON（MultiPolygon/Polygon）から外側をマスクするポリゴンを生成 */
function buildMaskCoords(geometry: GeoJSON.MultiPolygon | GeoJSON.Polygon): L.LatLngExpression[][] {
  const world: L.LatLngExpression[] = [
    [-90, -180], [-90, 180], [90, 180], [90, -180], [-90, -180],
  ];

  const holes: L.LatLngExpression[][] = [];
  const polys = geometry.type === "MultiPolygon" ? geometry.coordinates : [geometry.coordinates];
  for (const poly of polys) {
    for (const ring of poly) {
      holes.push(ring.map(([lng, lat]) => [lat, lng] as L.LatLngExpression));
    }
  }

  return [world, ...holes];
}

export default function MapView({ stations, selectedStation, onSelectStation, cityConfig }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const overlayRef = useRef<L.Layer[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize / re-initialize map when city changes
  useEffect(() => {
    // Clean up previous map
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markersRef.current = [];
    overlayRef.current = [];

    if (!containerRef.current) return;

    const cityBounds = L.latLngBounds(
      cityConfig.bounds[0] as [number, number],
      cityConfig.bounds[1] as [number, number],
    );

    const map = L.map(containerRef.current, {
      zoomControl: false,
      maxBounds: cityBounds.pad(0.05),
      maxBoundsViscosity: 1.0,
      minZoom: 10,
    }).fitBounds(cityBounds);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    // Load boundary GeoJSON
    if (cityConfig.boundaryFile) {
      fetch(`/${cityConfig.boundaryFile}`)
        .then(r => r.json())
        .then((feature: GeoJSON.Feature) => {
          const geom = feature.geometry as GeoJSON.MultiPolygon | GeoJSON.Polygon;

          const mask = L.polygon(buildMaskCoords(geom), {
            color: "transparent",
            fillColor: "#ffffff",
            fillOpacity: 0.75,
            interactive: false,
          }).addTo(map);

          const border = L.geoJSON(feature as GeoJSON.Feature, {
            style: {
              color: "#2563eb",
              weight: 2.5,
              opacity: 0.6,
              fillColor: "transparent",
              fillOpacity: 0,
            },
            interactive: false,
          }).addTo(map);

          overlayRef.current.push(mask, border);
        });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [cityConfig]);

  // Update markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach(s => {
      const isSelected = selectedStation?.id === s.id;
      const marker = L.marker([s.lat, s.lng], {
        icon: createMarkerIcon(s.type, s.no, isSelected),
        zIndexOffset: isSelected ? 1000 : s.type === "early" ? 200 : s.type === "polling" ? 100 : 0,
      });

      marker.on("click", () => onSelectStation(s));
      marker.addTo(map);
      markersRef.current.push(marker);
    });
  }, [stations, selectedStation, onSelectStation]);

  // Pan to selected
  useEffect(() => {
    if (selectedStation && mapRef.current) {
      mapRef.current.setView([selectedStation.lat, selectedStation.lng], Math.max(mapRef.current.getZoom(), 14), {
        animate: true,
      });
    }
  }, [selectedStation]);

  return <div ref={containerRef} className="w-full h-full" />;
}
