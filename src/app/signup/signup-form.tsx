"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { CATALOGUE } from "@/lib/catalogue";
import { square } from "@/lib/cloudinary-url";
import { gentle } from "@/lib/motion";
import { signUpManager, type SignupState } from "./actions";

const CURRENCIES = [
  ["EUR", "€ Euro"],
  ["GBP", "£ Pound"],
  ["USD", "$ Dollar"],
] as const;

type Starter = "catalogue" | "blank";
const PREVIEW = ["Rose (red)", "Peony", "Tulip", "Sunflower", "Hydrangea"]
  .map((n) => CATALOGUE.find((f) => f.name === n && f.photoUrl))
  .filter((f) => f !== undefined);

function StarterOption({
  value,
  checked,
  onPick,
  title,
  text,
  children,
}: {
  value: Starter;
  checked: boolean;
  onPick: (v: Starter) => void;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <label
      className={`relative flex cursor-pointer flex-col rounded-lg border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-moss ${
        checked ? "border-moss bg-sage-wash" : "border-hairline bg-linen/60 hover:border-soil/40"
      }`}
    >
      <input
        type="radio"
        name="starter-choice"
        value={value}
        checked={checked}
        onChange={() => onPick(value)}
        className="sr-only"
      />
      <span className="flex items-start justify-between gap-3">
        <span className="font-serif text-2xl leading-tight">{title}</span>
        <span
          aria-hidden
          className={`mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border ${
            checked ? "border-moss bg-moss" : "border-soil/30"
          }`}
        >
          {checked && <span className="size-2 rounded-full bg-linen" />}
        </span>
      </span>
      <span className="mt-2 text-sm text-soil-soft">{text}</span>
      {children}
    </label>
  );
}

export function SignupForm() {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUpManager, {});
  // Controlled so values survive React's form reset after an error.
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [currency, setCurrency] = useState<string>("EUR");
  const [starter, setStarter] = useState<Starter>("catalogue");

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

          <fieldset>
            <legend className="label-caps">Your flowers</legend>
            {/* The submitted value. React's post-error form reset would flip the radios back. */}
            <input type="hidden" name="starter" value={starter} />
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <StarterOption
                value="catalogue"
                checked={starter === "catalogue"}
                onPick={setStarter}
                title="Use Petal's list"
                text={`${CATALOGUE.length} common shop flowers, with photos. Rename, archive or add your own any time.`}
              >
                <div className="mt-4 flex -space-x-2" aria-hidden>
                  {PREVIEW.map((f) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={f.name}
                      src={square(f.photoUrl!, 96)}
                      alt=""
                      loading="lazy"
                      className="size-10 rounded-full border-2 border-linen object-cover"
                    />
                  ))}
                  <span className="flex size-10 items-center justify-center rounded-full border-2 border-linen bg-linen-deep font-mono text-[11px] text-soil-soft">
                    +{CATALOGUE.length - PREVIEW.length}
                  </span>
                </div>
              </StarterOption>
              <StarterOption
                value="blank"
                checked={starter === "blank"}
                onPick={setStarter}
                title="Start from a blank page"
                text="No flowers yet. Add exactly the ones you sell, with your own photos."
              />
            </div>
          </fieldset>

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
