import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PATHS = ["/user", "/admin"];
const HOME_PAGE = "/";
const LOGIN_PAGE = "/auth/login";

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  const isAuthPage = pathname.startsWith("/auth");
  const isPublicAsset = /\.(.*)$/.test(pathname) || pathname.startsWith("/_next");

  // ✅ Allow public assets
  if (isPublicAsset) {
    return NextResponse.next();
  }

  const token = request.cookies.get("accessToken")?.value;

  // 🔒 If path is protected and no token → redirect to login
  if (isProtectedPath && !token) {
    return redirectToLogin(request);
  }

  // 🧾 If user is not logged in, allow them to visit /auth/*
  if (isAuthPage && !token) {
    return NextResponse.next();
  }

  // ✅ If token exists, verify it
  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const role = payload?.role;

      // ⛔ If logged-in user tries to access /auth → redirect to home
      if (isAuthPage) {
        return NextResponse.redirect(new URL(HOME_PAGE, request.url));
      }

      // ✅ Allow based on role
      const isUser = role === "user" && pathname.startsWith("/user");
      const isAdmin =
        ["admin", "super_admin", "content_manager"].includes(role) &&
        pathname.startsWith("/admin");

      if (isUser || isAdmin) {
        return NextResponse.next();
      }

      // ❌ Role mismatch → redirect to home
      return NextResponse.redirect(new URL(HOME_PAGE, request.url));
    } catch (error) {
      console.error("JWT Error:", error);
      return redirectToLogin(request);
    }
  }

  // Default fallback
  return NextResponse.next();
}

function redirectToLogin(request) {
  const loginUrl = new URL(LOGIN_PAGE, request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/auth/:path*", "/user/:path*", "/admin/:path*"],
};


// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";

// const PROTECTED_PATHS = ["/auth", "/admin", "/user"];
// const HOME_PAGE = "/";

// export async function middleware(request) {
//   const { pathname } = request.nextUrl;

//   const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

//   // ✅ Public files like /favicon.ico, /_next/, /images etc.
//   const isPublicAsset = /\.(.*)$/.test(pathname) || pathname.startsWith("/_next");

//   if (!isProtected || isPublicAsset) {
//     return NextResponse.next();
//   }

//   const token = request.cookies.get("accessToken")?.value;

//   // 🔒 Protected path, but no token → redirect to login
//   if (!token) {
//     return redirectToLogin(request);
//   }

//   try {
//     const secret = new TextEncoder().encode(process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET);
//     const { payload } = await jwtVerify(token, secret);
//     const role = payload?.role;

//     // 🚫 Logged-in user going to /auth/* → redirect to home
//     if (pathname.startsWith("/auth")) {
//       return NextResponse.redirect(new URL(HOME_PAGE, request.url));
//     }

//     // ✅ Role-based path access
//     const isUser = role === "user" && pathname.startsWith("/user");
//     const isAdmin =
//       ["admin", "super_admin", "content_manager"].includes(role) &&
//       pathname.startsWith("/admin");

//     if (isUser || isAdmin) {
//       return NextResponse.next();
//     }

//     // ❌ Role mismatch → redirect to home
//     return NextResponse.redirect(new URL(HOME_PAGE, request.url));
//   } catch (error) {
//     console.error("JWT Error:", error);
//     return redirectToLogin(request);
//   }
// }

// function redirectToLogin(request) {
//   const loginUrl = new URL("/auth/login", request.url);
//   loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
//   return NextResponse.redirect(loginUrl);
// }

// // 🔧 Matcher: apply only to routes starting with /auth, /user, /admin
// export const config = {
//   matcher: ["/auth/:path*", "/user/:path*", "/admin/:path*"],
// };