"use client";

import { useActionState } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { setNewPassword, type FormState } from "../login/actions";

export function NewPasswordForm({ cta }: { cta: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(setNewPassword, {});

  return (
    <form action={action} className="mt-8 space-y-5">
      <PasswordInput name="password" label="New password" autoComplete="new-password" showStrength />
      <PasswordInput name="confirm" label="Type it again" autoComplete="new-password" />
      <FormNotice {...state} />
      <button type="submit" disabled={pending} className="btn-primary h-14 w-full text-lg">
        {pending ? "Saving…" : cta}
      </button>
    </form>
  );
}
