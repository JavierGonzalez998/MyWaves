import { NextRequest, NextResponse } from "next/server";
import { guardarConsulta, obtenerHistorial } from "@/lib/db";
import type { RespuestaMareas } from "@/types/mareas";

export async function GET(req: NextRequest) {
  try {
    const limit = req.nextUrl.searchParams.get("limit");
    const historial = await obtenerHistorial(limit ? parseInt(limit, 10) : undefined);
    return NextResponse.json(historial);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const datos: RespuestaMareas = await req.json();
    const id = await guardarConsulta(datos);
    return NextResponse.json({ id });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
