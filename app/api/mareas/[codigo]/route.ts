import { NextRequest, NextResponse } from "next/server";
import { obtenerCache, upsertCache } from "@/lib/db";
import { scrapeMareas } from "@/lib/scraper";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    let meses = obtenerCache(codigo);

    if (meses.length === 0) {
      meses = await scrapeMareas(codigo);
      for (const mes of meses) {
        upsertCache(mes);
      }
    }

    return NextResponse.json(meses);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
