"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const NAV_DELAY = 0.7;

export const Navbar = () => {
  const itemClass =
    "px-4 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-medium text-foreground/90 hover:text-foreground hover:bg-primary/20 hover:shadow hover:shadow-primary/30 hover:border-primary/40 transition-all duration-300";

  return (
    <motion.nav
      className="z-10 fixed left-[39%] top-[calc(var(--inset)+0.5rem)] md:top-[calc(var(--inset)+1rem)] -translate-x-1/2"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: NAV_DELAY }}
    >
      <div className="flex items-center gap-1 sm:gap-2 border-2 border-border/50 bg-primary/10 backdrop-blur-sm rounded-[16px] md:rounded-[24px] overflow-hidden ring-1 ring-offset-primary/5 ring-border/20 ring-offset-1 shadow-sm px-2 sm:px-3 py-1.5 sm:py-2">
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: NAV_DELAY + 0.05 }}>
          <Link href="#what" className={itemClass}>What</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: NAV_DELAY + 0.11 }}>
          <Link href="#why" className={itemClass}>Why</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: NAV_DELAY + 0.17 }}>
          <Link href="#how" className={itemClass}>How</Link>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut", delay: NAV_DELAY + 0.23 }}>
          <Link href="#whats-new" className={itemClass}>What&apos;s New</Link>
        </motion.div>
      </div>
    </motion.nav>
  );
};
