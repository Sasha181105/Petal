"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { PasswordInput } from "@/components/password-input";
import { gentle, quick } from "@/lib/motion";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  // Controlled so the email survives React's form reset after a failed attempt.
  const [email, setEmail] = useState("");
  const [scope, animate] = useAnimate<HTMLFormElement>();

  // A gentle head-shake on each failed attempt.
  useEffect(() => {
    if (state.at && scope.current) {
      animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });
    }
  }, [state.at, animate, scope]);

  return (
    <form ref={scope} action={action} className="mt-6 space-y-5">
      <label className="block">
        <span className="label-caps">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field mt-2 block h-14 w-full text-lg"
        />
      </label>
      <div>
        <PasswordInput name="password" label="Password" autoComplete="current-password" />
        <Link
          href="/forgot-password"
          className="mt-2 inline-block min-h-11 content-center text-sm text-soil-soft underline-offset-4 hover:text-soil hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      <AnimatePresence initial={false}>
        {state.error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={gentle}
            className="overflow-hidden"
          >
            <span className="block border-l-2 border-rose-deep bg-rose-wash px-4 py-3 text-sm">
              {state.error}
            </span>
          </motion.p>
        )}
      </AnimatePresence>
      <button type="submit" disabled={pending} className="btn-primary relative h-14 w-full overflow-hidden text-lg">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={pending ? "pending" : "idle"}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={quick}
          >
            {pending ? "Signing in…" : "Sign in →"}
          </motion.span>
        </AnimatePresence>
      </button>
    </form>
  );
}
