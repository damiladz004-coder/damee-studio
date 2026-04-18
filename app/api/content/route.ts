import { NextResponse } from "next/server";
import { getFeaturedContent } from "../../../lib/content";

export async function GET() {
  const content = await getFeaturedContent();
  return NextResponse.json({ content });
}
