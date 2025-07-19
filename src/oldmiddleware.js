import { NextResponse } from "next/server"

export function middleware(request) {
  const path = request.nextUrl.pathname

  // Allow all /auth/* routes
  if (path.startsWith("/auth/")) {
    return NextResponse.next();
  }

  try {
    // Check for token in cookies
    const token = request.cookies.get("accessToken")?.value

    if (!token) {
      // If no token, redirect to login
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    // If token exists, allow access
    return NextResponse.next()
  } catch (error) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|.*\\..*|_next).*)"],
}