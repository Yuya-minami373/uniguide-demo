import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { initDb } from "@/lib/db";

interface TaskRow {
  id: number;
  title: string;
  category: string;
  status: string;
  due_date: string;
  assignee_id: number;
  assignee_name: string;
  playbook_conditions: string;
  playbook_criteria: string;
  playbook_pitfalls: string;
  playbook_tip: string;
  memo: string;
}

export async function GET() {
  initDb();
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let tasks;
  if (session.role === "manager") {
    tasks = query<TaskRow>(`
      SELECT t.*, u.name as assignee_name, u2.name as sub_assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users u2 ON t.sub_assignee_id = u2.id
      ORDER BY t.due_date ASC
    `);
  } else {
    tasks = query<TaskRow>(`
      SELECT t.*, u.name as assignee_name, u2.name as sub_assignee_name
      FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id
      LEFT JOIN users u2 ON t.sub_assignee_id = u2.id
      WHERE t.assignee_id = ? OR t.sub_assignee_id = ?
      ORDER BY t.due_date ASC
    `, [session.id, session.id]);
  }

  return NextResponse.json(tasks);
}
