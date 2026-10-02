"use client";

import { useActionState } from "react";
import { FormNotice } from "@/components/form-notice";
import { requestPasswordReset, type FormState } from "../login/actions";

export function ForgotForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block">
        <span className="label-caps">Email</span>
        <input name="email" type="email" autoComplete="email" required className="field mt-2 block h-14 w-full text-lg" />
      </label>
      <FormNotice {...state} />
      <button type="submit" disabled={pending} className="btn-primary h-14 w-full text-lg">
        {pending ? "Sending…" : "Send me a link"}
      </button>
    </form>
  );
}
