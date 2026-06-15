"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const links = [
  { href: "#how", label: "How it works" },
  { href: "#templates", label: "Templates" },
  { href: "#reviews", label: "Reviews" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4"
    >
      <nav
        className={`flex w-full max-w-5xl items-center justify-between rounded-full px-4 py-2.5 transition-all duration-300 ${
          scrolled ? "glass-strong" : "border border-transparent"
        }`}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2 pl-1">
          <span className="h-6 w-6 rounded-lg bg-iridescent shadow-glow" aria-hidden />
          <span className="font-sans text-base font-semibold tracking-tight">
            Travel<span className="text-iridescent">OS</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </div>

        <Link href="/planner" className="btn-primary !px-5 !py-2 text-xs">
          Open the demo
        </Link>
      </nav>
    </motion.header>
  );
}
