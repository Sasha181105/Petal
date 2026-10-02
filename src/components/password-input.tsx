"use client";

import { useId, useState } from "react";
import { strength } from "@/lib/password";

type Props = {
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  /** Show the strength line under the field (for new passwords). */
  showStrength?: boolean;
  value?: string;
  onChange?: (value: string) => void;
};

const BAR = ["bg-hairline", "bg-clay", "bg-sage", "bg-moss"];

/** Password field with a show/hide toggle and an optional strength hint. */
export function PasswordInput({ name, label, autoComplete, showStrength, value, onChange }: Props) {
  const id = useId();
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  const [own, setOwn] = useState("");
  const text = value ?? own;
  const s = strength(text);

  return (
    <div>
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required
          value={text}
          onChange={(e) => (onChange ? onChange(e.target.value) : setOwn(e.target.value))}
          aria-describedby={showStrength ? hintId : undefined}
          className="field block h-14 w-full pr-20 text-lg"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-pressed={visible}
          aria-controls={id}
          className="absolute inset-y-0 right-1 my-auto h-11 rounded-md px-3 font-mono text-[11px] uppercase tracking-[0.14em] text-soil-soft hover:text-soil"
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      {showStrength && (
        <div id={hintId} className="mt-2">
          <div aria-hidden className="grid h-1 grid-cols-3 gap-1">
            {[1, 2, 3].map((n) => (
              <span key={n} className="rounded-full">
                <span className={`block h-full rounded-full transition-colors duration-300 ${s.score >= n ? BAR[s.score] : "bg-hairline/60"}`} />
              </span>
            ))}
          </div>
          <p className="mt-1 text-xs text-soil-soft">{s.label}</p>
        </div>
      )}
    </div>
  );
}
