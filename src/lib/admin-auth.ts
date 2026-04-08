import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function requireAdminSession() {
  const session = await auth();
  if (!session) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }),
    };
  }
  return { session, error: null };
}
