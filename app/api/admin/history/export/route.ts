import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { requireAdmin, requireAuth } from "@/lib/server/auth";
import { ApiError, toErrorResponse } from "@/lib/server/errors";
import { enforceRateLimit } from "@/lib/server/rate-limit";
import { historyQuerySchema } from "@/lib/validation";

const exportQuerySchema = historyQuerySchema;

function csvCell(value: string | number | null | undefined) {
  const raw = value == null ? "" : String(value);
  const escaped = raw.replace(/"/g, "\"\"");
  return `"${escaped}"`;
}

function buildHoursByEmployee(
  rows: Array<{
    employee: { id: string };
    type: string;
    timestamp: Date;
  }>,
) {
  const grouped = new Map<string, Array<{ type: "CLOCK_IN" | "CLOCK_OUT"; timestamp: Date }>>();

  for (const row of rows) {
    if (row.type !== "CLOCK_IN" && row.type !== "CLOCK_OUT") continue;
    const existing = grouped.get(row.employee.id);
    if (existing) {
      existing.push({ type: row.type, timestamp: row.timestamp });
    } else {
      grouped.set(row.employee.id, [{ type: row.type, timestamp: row.timestamp }]);
    }
  }

  const result = new Map<string, number>();
  const now = Date.now();

  for (const [employeeId, entries] of grouped.entries()) {
    const sorted = [...entries].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    let openClockIn: number | null = null;
    let totalMs = 0;

    for (const entry of sorted) {
      const ts = entry.timestamp.getTime();
      if (entry.type === "CLOCK_IN") {
        openClockIn = ts;
      } else if (openClockIn !== null && ts > openClockIn) {
        totalMs += ts - openClockIn;
        openClockIn = null;
      }
    }

    if (openClockIn !== null && now > openClockIn) {
      totalMs += now - openClockIn;
    }

    result.set(employeeId, totalMs / 3_600_000);
  }

  return result;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuth(req);
    requireAdmin(auth.dbUser);
    enforceRateLimit(
      "history-admin-export",
      `${auth.ip}:${auth.dbUser.id}`,
      RATE_LIMIT_CONFIG.history.limit,
      RATE_LIMIT_CONFIG.history.windowMs,
    );

    const { searchParams } = new URL(req.url);
    const query = exportQuerySchema.parse({
      limit: searchParams.get("limit") ?? undefined,
      start: searchParams.get("start") ?? undefined,
      end: searchParams.get("end") ?? undefined,
    });

    const where = {
      organizationId: auth.organizationId,
      ...(query.start || query.end
        ? {
            timestamp: {
              ...(query.start ? { gte: new Date(query.start) } : {}),
              ...(query.end ? { lt: new Date(query.end) } : {}),
            },
          }
        : {}),
    };

    const rows = await prisma.attendance.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: query.limit ?? 5000,
      select: {
        id: true,
        type: true,
        distance: true,
        timestamp: true,
        userAgent: true,
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            department: true,
            title: true,
          },
        },
      },
    });

    if (!rows.length) {
      throw new ApiError(404, "No attendance records to export.");
    }

    const hoursByEmployee = buildHoursByEmployee(rows);

    const header = [
      "Attendance ID",
      "Employee ID",
      "Employee Name",
      "Employee Email",
      "Employee Phone",
      "Department",
      "Title",
      "Type",
      "Timestamp (UTC)",
      "Distance",
      "Hours Worked",
      "User Agent",
    ];

    const body = rows.map((row) =>
      [
        row.id,
        row.employee.id,
        row.employee.name,
        row.employee.email,
        row.employee.phone,
        row.employee.department,
        row.employee.title,
        row.type,
        row.timestamp.toISOString(),
        row.distance.toFixed(4),
        (hoursByEmployee.get(row.employee.id) || 0).toFixed(2),
        row.userAgent,
      ]
        .map((cell) => csvCell(cell))
        .join(","),
    );

    const csv = `\uFEFF${header.map((cell) => csvCell(cell)).join(",")}\n${body.join("\n")}\n`;
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `attendance-history-${stamp}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error, "Failed to export attendance history.");
  }
}
