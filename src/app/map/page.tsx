import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import MapClient from "./MapClient";
import fs from "fs";
import path from "path";

interface PollingStation {
  id: number;
  no: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  voting_area: string | null;
  accessibility: string | null;
  type: "polling" | "poster" | "early";
  city: string;
}

interface CityConfig {
  city: string;
  label: string;
  center: [number, number];
  bounds: [[number, number], [number, number]];
  boundaryFile: string;
}

function loadCityConfigs(): CityConfig[] {
  const dataDir = path.join(process.cwd(), "public", "data");
  if (!fs.existsSync(dataDir)) return [];
  return fs.readdirSync(dataDir)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf-8"));
      return {
        city: data.city,
        label: data.label,
        center: data.center,
        bounds: data.bounds,
        boundaryFile: data.boundaryFile,
      };
    });
}

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string }>;
}) {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");

  const params = await searchParams;
  const cityConfigs = loadCityConfigs();
  const city = params.city && cityConfigs.some(c => c.city === params.city)
    ? params.city
    : "ichihara";

  const currentConfig = cityConfigs.find(c => c.city === city)!;

  const rawStations = await query<PollingStation>(
    "SELECT * FROM map_points WHERE city = ? ORDER BY type, no",
    [city]
  );

  // Convert libsql Row objects to plain objects for Client Component serialization
  const stations: PollingStation[] = JSON.parse(JSON.stringify(rawStations));

  return (
    <MapClient
      user={session}
      stations={stations}
      cityConfig={currentConfig}
      cityConfigs={cityConfigs}
    />
  );
}
