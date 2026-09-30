"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/waste", label: "Waste" },
  { href: "/deliveries", label: "Deliveries" },
  { href: "/flowers", label: "Flowers" },
  { href: "/dashboard", label: "Dashboard" },
];

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname.startsWith(href);
}

/** Phone: tab bar within thumb reach. Hidden on wider screens. */
export function BottomNav() {
  const isActive = useActive();

  return (
    <nav className="paper fixed inset-x-0 bottom-0 border-t border-soil pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
                  active ? "text-moss" : "text-soil-soft active:text-soil"
                }`}
              >
                {/* Small leaf marker on the current tab. */}
                <span
                  aria-hidden
                  className={`h-1.5 w-3 rounded-[100%_0] transition-colors ${
                    active ? "bg-moss" : "bg-transparent"
                  }`}
                />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet/desktop: text links in the masthead, underlined when current. */
export function TopNav() {
  const isActive = useActive();

  return (
    <nav className="hidden md:block">
      <ul className="flex gap-8">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`text-sm font-medium underline-offset-8 transition-colors ${
                  active
                    ? "text-soil underline decoration-moss decoration-2"
                    : "text-soil-soft hover:text-soil hover:underline hover:decoration-hairline hover:decoration-2"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
