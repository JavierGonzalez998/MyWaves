import { NextResponse } from "next/server";
import { limpiarCacheCompleto } from "@/lib/db";

export async function DELETE() {
  try {
    await limpiarCacheCompleto();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
