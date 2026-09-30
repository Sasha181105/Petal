"use client";

const MAX = 10_000;

type Props = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
};

const round =
  "grid size-14 shrink-0 place-items-center rounded-full border border-soil/30 text-2xl transition-colors hover:border-soil active:bg-linen-deep";

export function QuantityStepper({ value, onChange, label = "Stems" }: Props) {
  const set = (n: number) => onChange(Math.max(0, Math.min(MAX, n)));

  return (
    <div>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => set(value - 1)} aria-label="One less" className={round}>
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          aria-label={label}
          value={value === 0 ? "" : value}
          onChange={(e) => set(Number(e.target.value.replace(/\D/g, "")) || 0)}
          onFocus={(e) => e.target.select()}
          placeholder="0"
          className="h-16 w-full min-w-0 border-b border-hairline bg-transparent text-center font-serif text-6xl leading-none outline-none transition-colors focus:border-moss"
        />
        <button type="button" onClick={() => set(value + 1)} aria-label="One more" className={round}>
          +
        </button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[5, 10, 25].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(value + n)}
            className="chip h-12 rounded-full font-mono text-sm"
          >
            +{n}
          </button>
        ))}
      </div>
    </div>
  );
}
