"use client";

import { useEffect, useState } from "react";

/** "Wednesday 30 September" in the viewer's own time zone (after mount). */
export function TodayLabel({ className = "" }: { className?: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    setLabel(
      new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    );
  }, []);

  return <span className={className}>{label || " "}</span>;
}
