"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useOptimistic, useTransition } from "react";
import { tick } from "@/lib/haptics";
import { glide } from "@/lib/motion";
import { setDeliveriesEnabled } from "./actions";

/** On/off switch for the delivery log. Flips at once; the server catches up. */
export function DeliveriesSwitch({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useOptimistic(enabled);

  function toggle() {
    tick();
    startTransition(async () => {
      setOn(!on);
      await setDeliveriesEnabled(!on);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Deliveries"
      onClick={toggle}
      disabled={pending}
      className={`relative inline-flex h-9 w-16 shrink-0 items-center rounded-full border p-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-moss ${
        on ? "justify-end border-moss bg-moss" : "justify-start border-soil/30 bg-linen-deep"
      }`}
    >
      <motion.span
        layout
        transition={glide}
        className={`block size-7 rounded-full ${on ? "bg-linen" : "bg-soil-soft"}`}
      />
    </button>
  );
}
