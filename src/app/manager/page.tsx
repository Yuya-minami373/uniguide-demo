import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { initDb } from "@/lib/db";
import ManagerClient from "./ManagerClient";

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  start_date: string | null;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
  completed_at: string | null;
  effort_label: string | null;
  sub_assignee_id: number | null;
  sub_assignee_name: string | null;
}

interface UserRow {
  id: number;
  name: string;
  role: string;
  category: string;
}

export default async function ManagerPage({
  searchParams,
}: {
  searchParams: Promise<{ viewAs?: string }>;
}) {
  initDb();
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "manager" && session.role !== "unipoll") redirect("/dashboard");

  const { viewAs } = await searchParams;

  const tasks = query<TaskRow>(`
    SELECT t.id, t.title, t.category, t.status, t.start_date, t.due_date, t.assignee_id, u.name as assignee_name, t.completed_at, t.effort_label, t.sub_assignee_id, u2.name as sub_assignee_name
    FROM tasks t
    LEFT JOIN users u ON t.assignee_id = u.id
    LEFT JOIN users u2 ON t.sub_assignee_id = u2.id
    ORDER BY t.due_date ASC
  `);

  const staffUsers = query<UserRow>(
    "SELECT id, name, role, category FROM users WHERE role = 'staff' ORDER BY id"
  );

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const urgentTasks = tasks.filter(
    t => (t.due_date === today || t.due_date === tomorrow) && t.status !== "完了"
  );

  return (
    <ManagerClient
      session={session}
      tasks={tasks}
      staffUsers={staffUsers}
      urgentTasks={urgentTasks}
      today={today}
      tomorrow={tomorrow}
      demoMode={session.role === "unipoll"}
      viewAs={viewAs}
    />
  );
}
