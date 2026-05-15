import { NextResponse } from "next/server";
import { obtenerUbicaciones } from "@/lib/scraper";

export async function GET() {
  try {
    const ubicaciones = await obtenerUbicaciones();
    return NextResponse.json(ubicaciones);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
