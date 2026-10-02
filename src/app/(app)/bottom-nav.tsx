"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { glide } from "@/lib/motion";

type NavProps = { deliveriesEnabled: boolean; isManager: boolean };

const ALL_TABS = [
  { href: "/waste", label: "Waste" },
  { href: "/deliveries", label: "Deliveries" },
  { href: "/flowers", label: "Flowers" },
  { href: "/dashboard", label: "Dashboard", managerOnly: true },
];

/** Staff don't see the analytics tab. */
const tabsFor = (isManager: boolean) => ALL_TABS.filter((t) => isManager || !t.managerOnly);

function useActive() {
  const pathname = usePathname();
  return (href: string) => pathname.startsWith(href);
}

/** Optional features that are off get a quiet "off" mark on their tab. */
const isOff = (href: string, deliveriesEnabled: boolean) => href === "/deliveries" && !deliveriesEnabled;

/** Phone: tab bar within thumb reach. The leaf marker glides to the current tab. */
export function BottomNav({ deliveriesEnabled, isManager }: NavProps) {
  const isActive = useActive();
  const tabs = tabsFor(isManager);

  return (
    <nav className="paper fixed inset-x-0 bottom-0 print:hidden border-t border-soil pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className={`mx-auto grid max-w-lg ${tabs.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
        {tabs.map((tab) => {
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
                <span className="grid h-1.5 w-3 place-items-center">
                  {active && (
                    <motion.span
                      layoutId="bottom-nav-leaf"
                      transition={glide}
                      aria-hidden
                      className="h-1.5 w-3 rounded-[100%_0] bg-moss"
                    />
                  )}
                </span>
                <span className={isOff(tab.href, deliveriesEnabled) ? "opacity-50" : ""}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet/desktop: text links in the masthead; the underline glides between them. */
export function TopNav({ deliveriesEnabled, isManager }: NavProps) {
  const isActive = useActive();
  const tabs = tabsFor(isManager);

  return (
    <nav className="hidden md:block print:hidden">
      <ul className="flex gap-8">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <li key={tab.href} className="relative">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block py-1 text-sm font-medium transition-colors ${
                  active ? "text-soil" : "text-soil-soft hover:text-soil"
                }`}
              >
                {tab.label}
                {isOff(tab.href, deliveriesEnabled) && (
                  <span className="ml-1.5 align-super font-mono text-[9px] uppercase tracking-[0.14em] text-soil-soft">off</span>
                )}
              </Link>
              {active && (
                <motion.span
                  layoutId="top-nav-underline"
                  transition={glide}
                  aria-hidden
                  className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-moss"
                />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
