"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { gentle } from "@/lib/motion";
import { signUpManager, type SignupState } from "./actions";

const CURRENCIES = [
  ["EUR", "€ Euro"],
  ["GBP", "£ Pound"],
  ["USD", "$ Dollar"],
] as const;

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUpManager, {});
  // Controlled so values survive React's form reset after an error.
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<string>("EUR");

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.sentTo ? (
        <motion.div
          key="sent"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={gentle}
          className="mt-8 border-l-2 border-moss bg-sage-wash px-5 py-4 text-moss"
          role="status"
        >
          <p className="font-serif text-2xl">Check your email.</p>
          <p className="mt-2">
            We sent a link to <strong>{state.sentTo}</strong>. Open it on this device to confirm
            your address; your shop will be ready straight after.
          </p>
        </motion.div>
      ) : (
        <motion.form key="form" action={action} exit={{ opacity: 0 }} className="mt-8 space-y-6">
          <label className="block">
            <span className="label-caps">Shop name</span>
            <input
              name="shopName"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Fern & Fable Florist"
              required
              maxLength={80}
              autoComplete="organization"
              className="field mt-2 block h-14 w-full text-lg"
            />
          </label>

          <div>
            <span className="label-caps">Currency</span>
            <input type="hidden" name="currency" value={currency} />
            <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Currency">
              {CURRENCIES.map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  aria-pressed={currency === code}
                  onClick={() => setCurrency(code)}
                  className={`min-h-11 rounded-full border px-4 text-sm transition-colors ${
                    currency === code ? "border-soil bg-soil text-linen" : "border-soil/25 text-soil-soft hover:border-soil hover:text-soil"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="block border-t border-hairline pt-6">
            <span className="label-caps">Your email</span>
            <input
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="field mt-2 block h-14 w-full text-lg"
            />
          </label>
          <PasswordInput name="password" label="Password" autoComplete="new-password" showStrength />
          <PasswordInput name="confirm" label="Password again" autoComplete="new-password" />

          <FormNotice error={state.error} at={state.at} />
          <button type="submit" disabled={pending} className="btn-primary h-14 w-full text-lg">
            {pending ? "Creating your shop…" : "Create my shop →"}
          </button>
          <p className="text-sm text-soil-soft">
            You&apos;ll be the shop&apos;s manager. Add your florists afterwards in Settings → Team.
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
