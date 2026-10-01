"use client";

import { motion } from "motion/react";
import { gentle } from "@/lib/motion";

// A template (unlike a layout) re-mounts on every navigation, so each
// screen fades and rises in gently when you switch tabs.
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={gentle}>
      {children}
    </motion.div>
  );
}
