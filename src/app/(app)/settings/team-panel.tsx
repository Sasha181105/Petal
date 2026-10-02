"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState, useTransition } from "react";
import { FormNotice } from "@/components/form-notice";
import { PasswordInput } from "@/components/password-input";
import type { MemberRole } from "@/db/schema";
import { tick } from "@/lib/haptics";
import { freshRow, quick } from "@/lib/motion";
import { inviteMember, removeMember, setMemberRole, type TeamState } from "./team-actions";

export type Member = {
  userId: string;
  email: string;
  role: MemberRole;
  /** Never signed in yet: invitation not accepted. */
  invited: boolean;
};

export function TeamPanel({ members, me }: { members: Member[]; me: string }) {
  const [rowState, setRowState] = useState<TeamState>({});
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<TeamState>) {
    startTransition(async () => {
      const result = await fn();
      if (result.done) tick();
      setRowState(result);
    });
  }

  return (
    <div>
      <ul className="border-t border-soil">
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.li
              key={m.userId}
              layout
              {...freshRow}
              className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 overflow-hidden border-b border-hairline py-4 sm:grid-cols-[1fr_auto_auto]"
            >
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {m.email} {m.userId === me && <span className="text-soil-soft">(you)</span>}
                </span>
                <span className="label-caps">{m.invited ? "Invited · hasn't signed in yet" : "Active"}</span>
              </span>

              {/* Role switch: manager / staff */}
              <span role="group" aria-label={`Role for ${m.email}`} className="flex rounded-full border border-soil/25 p-0.5">
                {(["manager", "staff"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    aria-pressed={m.role === r}
                    disabled={pending || m.role === r}
                    onClick={() => run(() => setMemberRole(m.userId, r))}
                    className={`min-h-9 rounded-full px-3 text-xs font-medium capitalize transition-colors ${
                      m.role === r ? "bg-soil text-linen" : "text-soil-soft hover:text-soil"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </span>

              {m.userId === me ? (
                <span className="hidden sm:block" />
              ) : (
                <RemoveButton email={m.email} disabled={pending} onRemove={() => run(() => removeMember(m.userId))} />
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className="mt-3">
        <FormNotice {...rowState} />
      </div>

      <InviteForm />
    </div>
  );
}

function RemoveButton({ email, disabled, onRemove }: { email: string; disabled: boolean; onRemove: () => void }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {confirming ? (
        <motion.span key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={quick} className="col-span-2 flex items-center justify-end gap-2 sm:col-span-1">
          <button
            type="button"
            onClick={() => {
              setConfirming(false);
              onRemove();
            }}
            className="min-h-10 rounded-full bg-rose-deep px-4 text-sm font-medium text-linen active:scale-95"
          >
            Remove
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="min-h-10 px-2 text-sm text-soil-soft">
            Keep
          </button>
        </motion.span>
      ) : (
        <motion.button
          key="a"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={quick}
          type="button"
          disabled={disabled}
          aria-label={`Remove ${email} from the shop`}
          onClick={() => setConfirming(true)}
          className="col-span-2 justify-self-end font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft hover:text-rose-deep sm:col-span-1"
        >
          Remove
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function InviteForm() {
  const [state, action, pending] = useActionState<TeamState, FormData>(inviteMember, {});
  const [mode, setMode] = useState<"email" | "password">("email");
  const [role, setRole] = useState<"staff" | "manager">("staff");

  const pill = (active: boolean) =>
    `min-h-10 rounded-full border px-4 text-sm transition-colors ${
      active ? "border-soil bg-soil text-linen" : "border-soil/25 text-soil-soft hover:border-soil hover:text-soil"
    }`;

  return (
    <form action={action} className="mt-10 space-y-5 border-t border-hairline pt-6">
      <h3 className="font-serif text-3xl">Add someone</h3>
      <input type="hidden" name="mode" value={mode} />
      <input type="hidden" name="role" value={role} />

      <label className="block">
        <span className="label-caps">Their email</span>
        <input name="email" type="email" required autoComplete="off" className="field mt-2 block h-12 w-full text-lg" />
      </label>

      <div>
        <span className="label-caps">Role</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={role === "staff"} onClick={() => setRole("staff")} className={pill(role === "staff")}>
            Staff · logs waste and deliveries
          </button>
          <button type="button" aria-pressed={role === "manager"} onClick={() => setRole("manager")} className={pill(role === "manager")}>
            Manager · also settings, team and weeks
          </button>
        </div>
      </div>

      <div>
        <span className="label-caps">How they get in</span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" aria-pressed={mode === "email"} onClick={() => setMode("email")} className={pill(mode === "email")}>
            Email them an invitation
          </button>
          <button type="button" aria-pressed={mode === "password"} onClick={() => setMode("password")} className={pill(mode === "password")}>
            Set a password now
          </button>
        </div>
        <p className="mt-2 text-sm text-soil-soft">
          {mode === "email"
            ? "They get a link to choose their own password."
            : "Tell them the password in person; they can change it in Settings."}
        </p>
      </div>

      <AnimatePresence initial={false}>
        {mode === "password" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={quick} className="overflow-hidden">
            <PasswordInput name="password" label="Temporary password" autoComplete="new-password" showStrength />
          </motion.div>
        )}
      </AnimatePresence>

      <FormNotice {...state} />
      <button type="submit" disabled={pending} className="btn-primary h-12">
        {pending ? "Adding…" : mode === "email" ? "Send invitation" : "Create account"}
      </button>
    </form>
  );
}
