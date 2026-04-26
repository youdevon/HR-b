import { NextResponse } from "next/server";
import { generateAllSystemAlerts } from "@/lib/queries/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    if (!CRON_SECRET) {
      return NextResponse.json(
        { success: false, message: "CRON_SECRET is not configured" },
        { status: 503 }
      );
    }
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const counts = await generateAllSystemAlerts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      counts,
      byModule: counts.byModule,
      byRule: counts.byRule,
    });
  } catch (error) {
    console.error("Notification cron error:", error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Notification cron job failed",
      },
      { status: 500 }
    );
  }
}
