import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";
import { fetchCrewOverview } from "@/lib/crew-queries";
import CrewDashboardClient from "./CrewDashboardClient";

const DEMO_DATE = "2026-07-06";

export default async function CrewPage() {
  await initDb();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "crew_lead") redirect("/crew/report");

  const initialOverview = await fetchCrewOverview(DEMO_DATE);

  return (
    <CrewDashboardClient
      session={session}
      demoMode={session.role === "unipoll"}
      initialOverview={initialOverview}
    />
  );
}
