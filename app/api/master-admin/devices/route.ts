import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireMasterAdminAuth } from "@/lib/server/auth";

export async function GET(req: Request) {
  try {
    await requireMasterAdminAuth(req);

    const devices = await prisma.device.findMany({
      include: {
        organization: true
      },
      orderBy: { createdAt: "desc" }
    });

    const now = new Date();

    const formatted = devices.map((device) => {
      // Calculate last seen online status based on lastActiveAt
      let status = "Offline";
      let lastSeen = "Never";
      
      if (device.lastActiveAt) {
        const diffMins = Math.floor((now.getTime() - device.lastActiveAt.getTime()) / 60000);
        if (diffMins < 10) {
          status = "Online";
        }
        
        if (diffMins < 60) {
          lastSeen = `${diffMins} mins ago`;
        } else if (diffMins < 1440) {
          lastSeen = `${Math.floor(diffMins / 60)} hours ago`;
        } else {
          lastSeen = `${Math.floor(diffMins / 1440)} days ago`;
        }
      }

      return {
        id: device.id,
        name: device.name,
        org: device.organization.name,
        lastSeen,
        status,
        location: "Unknown" // Placeholder, in a real system you'd use geo-ip
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
}
