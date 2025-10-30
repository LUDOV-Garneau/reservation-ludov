import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

type NowRow = RowDataPacket & { now: string };

export async function GET() {
  try {
    const [rows] = await pool.query<NowRow[]>("SELECT UTC_TIMESTAMP() as now");
    return NextResponse.json(
      { success: true, time: rows[0].now },
      { status: 200 }
    );
  } catch (error: unknown) {
    let message = "Unknown error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
