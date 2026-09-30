"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="mt-6 space-y-5">
      <label className="block">
        <span className="label-caps">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field mt-2 block h-14 w-full text-lg"
        />
      </label>
      <label className="block">
        <span className="label-caps">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field mt-2 block h-14 w-full text-lg"
        />
      </label>
      {state.error && (
        <p role="alert" className="border-l-2 border-rose-deep bg-rose-wash px-4 py-3 text-sm">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-primary h-14 w-full text-lg">
        {pending ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}
