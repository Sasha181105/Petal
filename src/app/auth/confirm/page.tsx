"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Logo } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

/**
 * Where links in Supabase emails land (password reset, staff invitation).
 * Supabase can send any of three shapes, depending on the flow and template:
 *   ?code=…                     (PKCE, e.g. "forgot password")
 *   ?token_hash=…&type=…        (custom email templates)
 *   #access_token=…&refresh_token=…  (admin invitations)
 * Each becomes a session; then we continue to ?next (a path in this app).
 */
function Confirm() {
  const router = useRouter();
  const params = useSearchParams();
  const [failed, setFailed] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return; // React dev mode runs effects twice; links work once.
    ran.current = true;

    const nextParam = params.get("next") ?? "/waste";
    // Only ever continue to a path inside this app.
    const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/waste";
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const supabase = createClient();

    (async () => {
      const problem = params.get("error_description") ?? hash.get("error_description");
      if (problem) return setFailed(problem);

      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      const { error } = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : tokenHash && type
          ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
          : accessToken && refreshToken
            ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
            : { error: new Error("This link is incomplete.") };

      if (error) return setFailed(error.message);
      // An invitation lands on the password page with a welcome.
      const invited = hash.get("type") === "invite" || type === "invite";
      router.replace(invited && next === "/reset-password" ? "/reset-password?welcome=1" : next);
    })();
  }, [params, router]);

  if (failed) {
    return (
      <>
        <h1 className="font-serif text-5xl">
          That link <em className="text-rose-deep">didn&apos;t work.</em>
        </h1>
        <p className="mt-4 text-soil-soft">
          Links from Petal emails work once and expire after an hour. Ask for a fresh one.
        </p>
        <p className="mt-2 text-sm text-soil-soft">({failed})</p>
        <div className="mt-8 flex gap-6">
          <Link href="/forgot-password" className="btn-primary h-12">
            Send a new link
          </Link>
          <Link href="/login" className="min-h-12 content-center underline decoration-hairline decoration-2 underline-offset-8">
            Sign in
          </Link>
        </div>
      </>
    );
  }

  return (
    <p className="label-caps" role="status">
      Checking your link…
    </p>
  );
}

export default function ConfirmPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-5">
      <header className="border-b border-hairline py-5">
        <Logo />
      </header>
      <main className="flex flex-1 flex-col justify-center py-16">
        <Suspense>
          <Confirm />
        </Suspense>
      </main>
    </div>
  );
}
