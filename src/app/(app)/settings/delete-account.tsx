"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import { gentle } from "@/lib/motion";
import { deleteAccount, type DeleteState } from "./account-actions";

/** `wholeShop`: this is the last manager, so the shop goes too. */
export function DeleteAccount({ wholeShop, shopName, teamSize }: { wholeShop: boolean; shopName: string; teamSize: number }) {
  const [open, setOpen] = useState(false);
  // Controlled, so a failed attempt (wrong password, typo in the name) keeps what was typed.
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});

  return (
    <div className="max-w-md">
      <p className="text-sm text-soil-soft">
        {wholeShop ? (
          <>
            You&apos;re the shop&apos;s only manager, so deleting your account also deletes{" "}
            <strong className="font-medium text-soil">{shopName}</strong>: every flower, photo, delivery, waste
            entry and report
            {teamSize > 0 && (
              <>
                , and {teamSize === 1 ? "your teammate's account" : `the ${teamSize} accounts of your team`}
              </>
            )}
            . This can&apos;t be undone. To keep the shop, make someone else a manager first.
          </>
        ) : (
          <>Your account is removed and you&apos;re signed out. Entries you logged stay in the shop, without your name. This can&apos;t be undone.</>
        )}
      </p>

      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.form
            key="form"
            action={action}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={gentle}
            className="overflow-hidden"
          >
            <div className="space-y-5 pt-5">
              {wholeShop && (
                <div>
                  <label htmlFor="delete-shop-name" className="label-caps">
                    Type the shop name: {shopName}
                  </label>
                  <input
                    id="delete-shop-name"
                    name="shopName"
                    autoComplete="off"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="field mt-2 h-12 w-full"
                  />
                </div>
              )}
              <PasswordInput name="password" label="Your password" autoComplete="current-password" value={password} onChange={setPassword} />
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="btn h-12 bg-rose-deep text-linen hover:bg-soil"
                >
                  {pending ? "Deleting…" : wholeShop ? "Delete account and shop" : "Delete my account"}
                </button>
                <button type="button" onClick={() => setOpen(false)} disabled={pending} className="btn-ghost h-12">
                  Cancel
                </button>
              </div>
              <FormNotice {...state} />
            </div>
          </motion.form>
        ) : (
          <motion.div key="open" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-5">
            <button type="button" onClick={() => setOpen(true)} className="btn-secondary h-12 hover:border-rose-deep hover:text-rose-deep">
              Delete account…
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
