import { query } from "@/lib/db";

export interface LocationOverview {
  id: number;
  name: string;
  short_name: string;
  address: string;
  lat: number;
  lng: number;
  open_time: string;
  close_time: string;
  latest_report: {
    time_slot: string;
    voter_count: number;
    congestion_status: string;
    operation_status: string;
    note: string | null;
    reported_at: string;
  } | null;
  total_voters: number;
  incidents: {
    time_slot: string;
    operation_status: string;
    note: string | null;
  }[];
}

export async function fetchCrewOverview(date: string): Promise<LocationOverview[]> {
  const rows = await query<{
    id: number;
    name: string;
    short_name: string;
    address: string;
    lat: number;
    lng: number;
    open_time: string;
    close_time: string;
    latest_time_slot: string | null;
    latest_voter_count: number | null;
    latest_congestion: string | null;
    latest_operation: string | null;
    latest_note: string | null;
    latest_reported_at: string | null;
    total_voters: number;
  }>(
    `SELECT l.id, l.name, l.short_name, l.address, l.lat, l.lng, l.open_time, l.close_time,
       lr.time_slot AS latest_time_slot, lr.voter_count AS latest_voter_count,
       lr.congestion_status AS latest_congestion, lr.operation_status AS latest_operation,
       lr.note AS latest_note, lr.reported_at AS latest_reported_at,
       COALESCE(t.total, 0) AS total_voters
     FROM crew_locations l
     LEFT JOIN (
       SELECT h1.crew_location_id, h1.time_slot, h1.voter_count, h1.congestion_status,
              h1.operation_status, h1.note, h1.reported_at
       FROM hourly_reports h1
       INNER JOIN (
         SELECT crew_location_id, MAX(time_slot) AS max_slot
         FROM hourly_reports WHERE report_date = ?
         GROUP BY crew_location_id
       ) h2 ON h1.crew_location_id = h2.crew_location_id AND h1.time_slot = h2.max_slot
       WHERE h1.report_date = ?
     ) lr ON l.id = lr.crew_location_id
     LEFT JOIN (
       SELECT crew_location_id, SUM(voter_count) AS total
       FROM hourly_reports WHERE report_date = ?
       GROUP BY crew_location_id
     ) t ON l.id = t.crew_location_id
     ORDER BY l.id`,
    [date, date, date]
  );

  const incidents = await query<{
    crew_location_id: number;
    time_slot: string;
    operation_status: string;
    note: string | null;
  }>(
    `SELECT crew_location_id, time_slot, operation_status, note
     FROM hourly_reports
     WHERE report_date = ? AND operation_status != '異常なし'
     ORDER BY time_slot DESC`,
    [date]
  );

  return rows.map(row => ({
    id: row.id,
    name: row.name,
    short_name: row.short_name,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    open_time: row.open_time,
    close_time: row.close_time,
    latest_report: row.latest_time_slot ? {
      time_slot: row.latest_time_slot,
      voter_count: row.latest_voter_count!,
      congestion_status: row.latest_congestion!,
      operation_status: row.latest_operation!,
      note: row.latest_note,
      reported_at: row.latest_reported_at!,
    } : null,
    total_voters: row.total_voters,
    incidents: incidents.filter(inc => inc.crew_location_id === row.id),
  }));
}
