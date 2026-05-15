import { NextRequest, NextResponse } from "next/server";
import { upsertCache } from "@/lib/db";
import { scrapeMareas } from "@/lib/scraper";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const meses = await scrapeMareas(codigo);
    for (const mes of meses) {
      await upsertCache(mes);
    }
    return NextResponse.json(meses);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
