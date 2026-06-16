import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|q/|book/|api/questionnaires|api/public/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
