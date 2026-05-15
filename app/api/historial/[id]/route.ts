import { NextRequest, NextResponse } from "next/server";
import { obtenerConsulta } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const consulta = obtenerConsulta(parseInt(id, 10));
    return NextResponse.json(consulta);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
