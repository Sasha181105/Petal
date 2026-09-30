import type { WasteReason } from "@/db/schema";

type Reason = {
  value: WasteReason;
  label: string;
  /** Button look when not selected / selected. */
  idle: string;
  selected: string;
  /** Colour dot used in lists. */
  dot: string;
};

// Each reason keeps one colour everywhere: rose, clay, moss, soil.
export const REASONS: Reason[] = [
  {
    value: "wilted",
    label: "Wilted",
    idle: "border-rose/60 bg-rose-wash/60 text-rose-deep hover:border-rose-deep",
    selected: "border-rose-deep bg-rose-deep text-linen",
    dot: "bg-rose-deep",
  },
  {
    value: "damaged",
    label: "Damaged",
    idle: "border-clay/40 bg-clay-wash/60 text-clay hover:border-clay",
    selected: "border-clay bg-clay text-linen",
    dot: "bg-clay",
  },
  {
    value: "unsold",
    label: "Unsold",
    idle: "border-sage bg-sage-wash/70 text-moss hover:border-moss",
    selected: "border-moss bg-moss text-linen",
    dot: "bg-moss",
  },
  {
    value: "other",
    label: "Other",
    idle: "border-hairline bg-linen-deep/60 text-soil-soft hover:border-soil",
    selected: "border-soil bg-soil text-linen",
    dot: "bg-soil-soft",
  },
];

export const reasonOf = (value: WasteReason) => REASONS.find((r) => r.value === value)!;
export const reasonLabel = (value: WasteReason) => reasonOf(value).label;
