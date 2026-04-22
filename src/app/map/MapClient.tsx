"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import type { User } from "@/lib/auth";
import dynamic from "next/dynamic";

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
  user: User;
  stations: Station[];
  cityConfig: CityConfig;
  cityConfigs: CityConfig[];
}

const MapView = dynamic(() => import("./MapView"), { ssr: false });

export default function MapClient({ user, stations, cityConfig, cityConfigs }: Props) {
  const router = useRouter();
  const [showPolling, setShowPolling] = useState(true);
  const [showEarly, setShowEarly] = useState(true);
  const [showPoster, setShowPoster] = useState(true);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Reset selection when city changes
  useEffect(() => {
    setSelectedStation(null);
    setSearchQuery("");
  }, [cityConfig.city]);

  const pollingStations = stations.filter(s => s.type === "polling");
  const earlyStations = stations.filter(s => s.type === "early");
  const posterStations = stations.filter(s => s.type === "poster");

  const filteredStations = stations.filter(s => {
    if (s.type === "polling" && !showPolling) return false;
    if (s.type === "early" && !showEarly) return false;
    if (s.type === "poster" && !showPoster) return false;
    if (searchQuery) {
      const q = searchQuery.trim();
      if (/^\d+$/.test(q)) {
        return String(s.no) === q || String(s.no).startsWith(q);
      }
      const ql = q.toLowerCase();
      return s.name.toLowerCase().includes(ql);
    }
    return true;
  });

  const handleCityChange = (newCity: string) => {
    router.push(`/map?city=${newCity}`);
  };

  return (
    <AppShell user={user}>
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Controls + List */}
        <div className="w-[260px] lg:w-[320px] shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Header with city selector */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-sm font-bold text-gray-900">投票所・掲示場マップ</h1>
              {cityConfigs.length > 1 && (
                <select
                  value={cityConfig.city}
                  onChange={e => handleCityChange(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                >
                  {cityConfigs.map(c => (
                    <option key={c.city} value={c.city}>{c.label}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5">
              投票所 {pollingStations.length}箇所 / 期日前 {earlyStations.length}箇所 / 掲示場 {posterStations.length}箇所
            </p>
          </div>

          {/* Search */}
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="投票所名・投票所番号で検索..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPolling}
                onChange={e => setShowPolling(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/20"
              />
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                投票所
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showEarly}
                onChange={e => setShowEarly(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-500 focus:ring-emerald-500/20"
              />
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                期日前
              </span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showPoster}
                onChange={e => setShowPoster(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500/20"
              />
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                掲示場
              </span>
            </label>
          </div>

          {/* Station list */}
          <div className="flex-1 overflow-y-auto">
            {filteredStations.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedStation(s)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors border-b border-gray-50 ${
                  selectedStation?.id === s.id ? "bg-blue-50" : "hover:bg-gray-50"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                  s.type === "polling" ? "bg-blue-600" : s.type === "early" ? "bg-emerald-500" : "bg-orange-500"
                }`}>
                  {s.no}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate">{s.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{s.address}</p>
                </div>
              </button>
            ))}
            {filteredStations.length === 0 && (
              <div className="px-4 py-8 text-center">
                <p className="text-xs text-gray-400">該当する施設がありません</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map */}
        <div className="flex-1 relative">
          {mounted && (
            <MapView
              stations={filteredStations}
              selectedStation={selectedStation}
              onSelectStation={setSelectedStation}
              cityConfig={cityConfig}
            />
          )}

          {/* Selected station detail popup */}
          {selectedStation && (
            <div className="absolute bottom-4 left-4 right-4 max-w-md z-[1000] bg-white rounded-xl border border-gray-200 shadow-lg px-5 py-4">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 ${
                  selectedStation.type === "polling" ? "bg-blue-600" : selectedStation.type === "early" ? "bg-emerald-500" : "bg-orange-500"
                }`}>
                  {selectedStation.no}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      selectedStation.type === "polling" ? "bg-blue-50 text-blue-700" : selectedStation.type === "early" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                    }`}>
                      {selectedStation.type === "polling" ? "投票所" : selectedStation.type === "early" ? "期日前投票所" : "掲示場"}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{selectedStation.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{selectedStation.address}</p>
                  {selectedStation.voting_area && (
                    <p className="text-[11px] text-gray-400 mt-1">投票区域: {selectedStation.voting_area}</p>
                  )}
                  {selectedStation.accessibility && (
                    <p className="text-[11px] text-blue-600 mt-1">{selectedStation.accessibility}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-300 hover:text-gray-500 transition shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
