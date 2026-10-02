import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The home page and login are open to everyone; the rest needs a session.
const PUBLIC_PREFIXES = ["/login", "/signup", "/forgot-password", "/auth/"];
const isPublic = (pathname: string) =>
  pathname === "/" || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

// Refreshes the Supabase session cookie on every request and keeps
// signed-out visitors on the login page.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // An ?error on /login (e.g. no-shop) must be shown, not bounced back.
  if (user && (pathname === "/login" || pathname === "/signup") && !request.nextUrl.searchParams.has("error")) {
    return NextResponse.redirect(new URL("/waste", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Static files and robots.txt are public and need no session.
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
