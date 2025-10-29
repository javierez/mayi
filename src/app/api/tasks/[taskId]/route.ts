import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateTaskWithAuth } from "~/server/queries/task";
import { getSecureSession } from "~/lib/dal";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) {
  try {
    // Use DAL for authentication - the correct pattern
    const session = await getSecureSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await params;
    const body = (await request.json()) as { status?: string };

    if (!body.status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 },
      );
    }

    // Validate status
    const validStatuses = [
      "backlog",
      "blocked",
      "ready",
      "in_progress",
      "validation",
      "finished",
    ];

    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Update the task - only update the status field
    await updateTaskWithAuth(Number(taskId), {
      status: body.status as
        | "backlog"
        | "blocked"
        | "ready"
        | "in_progress"
        | "validation"
        | "finished",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}
