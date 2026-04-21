import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // Skip Basic Auth in development
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (authHeader) {
    const [scheme, encoded] = authHeader.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = atob(encoded);
      const [user, pass] = decoded.split(":");
      const credentials = [
        { user: process.env.BASIC_AUTH_USER, pass: process.env.BASIC_AUTH_PASS },
        { user: process.env.BASIC_AUTH_USER_2, pass: process.env.BASIC_AUTH_PASS_2 },
      ].filter((c) => c.user && c.pass);
      if (credentials.some((c) => c.user === user && c.pass === pass)) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse(null, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="UniGuide"',
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
