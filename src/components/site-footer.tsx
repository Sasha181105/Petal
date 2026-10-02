const AUTHOR = { name: "Oleksandra Danylenko", url: "https://github.com/Sasha181105" };

/** Shared footer: what Petal is, and who made it. */
export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-t border-hairline py-6 font-mono text-[11px] uppercase tracking-[0.18em] text-soil-soft ${className}`}
    >
      <span>
        <span className="font-serif text-base normal-case italic tracking-normal text-soil">Petal</span>
        {" · a waste ledger for florists"}
      </span>
      <span>
        Created by{" "}
        <a
          href={AUTHOR.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-soil underline decoration-hairline decoration-2 underline-offset-4 transition-colors hover:decoration-rose-deep"
        >
          {AUTHOR.name}
        </a>{" "}
        · {new Date().getFullYear()}
      </span>
    </footer>
  );
}
