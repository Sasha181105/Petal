"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { glide } from "@/lib/motion";

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

/** Phone: tab bar within thumb reach. The leaf marker glides to the current tab. */
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
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet/desktop: text links in the masthead; the underline glides between them. */
export function TopNav() {
  const isActive = useActive();

  return (
    <nav className="hidden md:block">
      <ul className="flex gap-8">
        {TABS.map((tab) => {
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
