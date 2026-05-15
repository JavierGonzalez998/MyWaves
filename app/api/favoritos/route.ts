import { NextRequest, NextResponse } from "next/server";
import { agregarFavorito, obtenerFavoritos } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json(await obtenerFavoritos());
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { codigo, nombre } = await req.json();
    await agregarFavorito(codigo, nombre);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
