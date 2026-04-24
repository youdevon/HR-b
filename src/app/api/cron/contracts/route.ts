import { NextResponse } from "next/server";
import { generateContractExpiryAlerts } from "@/lib/queries/alerts";

// Optional: protect the endpoint with a secret
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // --- SECURITY (recommended for production) ---
    // Vercel Cron can send a header like: Authorization: Bearer <secret>
    if (CRON_SECRET) {
      const authHeader = request.headers.get("authorization");

      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json(
          { success: false, message: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // --- RUN ALERT GENERATION ---
    await generateContractExpiryAlerts();

    return NextResponse.json({
      success: true,
      message: "Contract alerts generated successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Cron error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
      },
      { status: 500 }
    );
  }
}