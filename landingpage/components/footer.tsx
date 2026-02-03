"use client";

import { InstagramLogoIcon } from "@radix-ui/react-icons";
import { buttonVariants } from "./ui/button";
import XLogoIcon from "./icons/x";
import GmailIcon from "./icons/gmail";
import { socialLinks } from "@/lib/constants";
import Link from "next/link";
import { motion } from "framer-motion";

const FOOTER_DELAY = 1.6;

export const Footer = () => {
  return (
    <motion.div
      className="flex gap-6 items-center absolute bottom-[calc(var(--inset)+0.8rem)] md:bottom-[calc(var(--inset)+1.5rem)] left-[calc(var(--inset)+1rem)] md:left-[calc(var(--inset)+2rem)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: FOOTER_DELAY }}
    >
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut", delay: FOOTER_DELAY + 0.05 }} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
        <Link target="_blank" className={buttonVariants({ size: "icon-xl" })} href={socialLinks.gmail}>
          <GmailIcon className="size-6" />
        </Link>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut", delay: FOOTER_DELAY + 0.13 }} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
        <Link target="_blank" className={buttonVariants({ size: "icon-xl" })} href={socialLinks.x}>
          <XLogoIcon className="size-6" />
        </Link>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, ease: "easeOut", delay: FOOTER_DELAY + 0.21 }} whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.96 }}>
        <Link target="_blank" className={buttonVariants({ size: "icon-xl" })} href={socialLinks.instagram}>
          <InstagramLogoIcon className="size-6" />
        </Link>
      </motion.div>
    </motion.div>
  );
};
