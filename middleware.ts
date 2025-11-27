import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes yang hanya bisa diakses oleh authenticated users
const protectedRoutes = ["/dashboard"];

// Public routes yang hanya bisa diakses oleh unauthenticated users
const publicRoutes = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Get auth token dari cookie (optional, untuk full protection)
  // Untuk sekarang, middleware ini basic - full protection di client
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\..*|public).*)"],
};
