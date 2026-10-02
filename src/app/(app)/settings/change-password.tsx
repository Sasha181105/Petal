"use client";

import { useActionState } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { changePassword, type FormState } from "@/app/login/actions";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(changePassword, {});

  return (
    <div className="max-w-md space-y-5">
      {/* A new key after success remounts the fields, which clears them. */}
      <form key={state.done ? state.at : "form"} action={action} className="space-y-5">
        <PasswordInput name="current" label="Current password" autoComplete="current-password" />
        <PasswordInput name="password" label="New password" autoComplete="new-password" showStrength />
        <PasswordInput name="confirm" label="New password again" autoComplete="new-password" />
        <button type="submit" disabled={pending} className="btn-secondary h-12">
          {pending ? "Changing…" : "Change password"}
        </button>
      </form>
      <FormNotice {...state} />
    </div>
  );
}
