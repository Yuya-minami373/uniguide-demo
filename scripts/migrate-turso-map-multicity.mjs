/**
 * Turso DB migration: map_points にcity列追加 + 既存データをichihara更新 + 深谷市データ投入
 * Usage: node scripts/migrate-turso-map-multicity.mjs
 */
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  // Step 1: Check if city column exists
  const tableInfo = await client.execute("PRAGMA table_info(map_points)");
  const hasCityCol = tableInfo.rows.some(r => r.name === "city");

  if (!hasCityCol) {
    console.log("Adding city column to map_points...");
    await client.execute("ALTER TABLE map_points ADD COLUMN city TEXT NOT NULL DEFAULT 'ichihara'");
    console.log("✅ city column added (existing rows set to 'ichihara')");
  } else {
    console.log("✅ city column already exists");
  }

  // Step 2: Check if fukaya data exists
  const fukayaCount = await client.execute("SELECT COUNT(*) as c FROM map_points WHERE city = 'fukaya'");
  const count = fukayaCount.rows[0].c;

  if (count > 0) {
    console.log(`✅ Fukaya data already exists (${count} rows). Skipping.`);
    return;
  }

  // Step 3: Load fukaya.json and insert
  const jsonPath = join(__dirname, "..", "public", "data", "fukaya.json");
  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const stations = data.stations;
  console.log(`Inserting ${stations.length} fukaya stations...`);

  // Batch insert 20 at a time
  for (let i = 0; i < stations.length; i += 20) {
    const batch = stations.slice(i, i + 20);
    const placeholders = batch.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ");
    const values = batch.flatMap(s => [
      s.no, s.name, s.address, s.lat, s.lng,
      s.voting_area ?? null, s.accessibility ?? null, s.type, "fukaya",
    ]);
    await client.execute({
      sql: `INSERT INTO map_points (no, name, address, lat, lng, voting_area, accessibility, type, city) VALUES ${placeholders}`,
      args: values,
    });
  }

  // Step 4: Verify
  const verify = await client.execute("SELECT city, type, COUNT(*) as c FROM map_points GROUP BY city, type ORDER BY city, type");
  console.log("\n📊 Data summary:");
  for (const row of verify.rows) {
    console.log(`  ${row.city} / ${row.type}: ${row.c}`);
  }
  console.log("\n✅ Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
