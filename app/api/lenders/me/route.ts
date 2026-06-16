import { NextRequest, NextResponse } from "next/server";
import { getLenderSession } from "@/lib/lenderAuth";
export async function GET(req: NextRequest) {
  const user = await getLenderSession(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ user });
}
