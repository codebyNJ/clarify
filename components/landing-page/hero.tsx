"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { InteractiveHoverButton } from "@/components/landing-page/ui/interactive-hover-button";
import { buttonVariants } from "@/components/landing-page/ui/button";
import { GoogleAuthModal } from "@/components/google-auth-modal";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

const DURATION = 0.3;
const EASE_OUT = "easeOut";

const BG_FADE_DURATION = 0.9;
const TITLE_STAGGER = 0.08;
const TITLE = "Clarify";

export const Hero = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const titleDelay = BG_FADE_DURATION + 0.2;
  const captionDelay = titleDelay + TITLE.length * TITLE_STAGGER + 0.2;

  const handleGetStarted = () => {
    if (user) {
      router.push("/notes");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="flex overflow-hidden relative flex-col gap-4 justify-center items-center pt-2 w-full h-full pb-footer-safe-area">
      {/* Title - centered on mobile, shifted left on desktop */}
      <div className="md:-ml-40 mt-0 md:mt-32">
        <motion.h1
          className="font-serif text-7xl short:text-6xl italic sm:text-8xl md:text-9xl !text-white"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: { staggerChildren: TITLE_STAGGER, delayChildren: titleDelay },
          },
        }}
      >
        {TITLE.split("").map((ch, i) => (
          <motion.span
            key={`${ch}-${i}`}
            className="inline-block"
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.35, ease: EASE_OUT }}
          >
            {ch}
          </motion.span>
        ))}
        </motion.h1>
      </div>

      {/* Description - positioned on the right side (hidden on mobile) */}
      <motion.div
        className="hidden md:block absolute right-10 md:right-16 lg:right-24 top-[30%] short:top-[25%] font-serif text-xl short:text-lg italic sm:text-2xl md:text-3xl lg:text-4xl !text-white max-w-[200px] md:max-w-[240px] lg:max-w-[280px] text-left"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: captionDelay }}
      >
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: captionDelay + 0.05 }}>
          Simplify your mind,
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: captionDelay + 0.15 }}>
          Amplify your clarity.
        </motion.div>
        <motion.div
          className="mt-6 short:mt-4 text-sm sm:text-base md:text-lg font-sans font-normal italic text-justify"
          style={{ lineHeight: "1.8" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: captionDelay + 0.35 }}
        >
          Store your <span className="clarify-word-pill px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default">ideas</span>, <span className="clarify-word-pill px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default">saves</span>, <span className="clarify-word-pill px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default">sparks</span>, <span className="clarify-word-pill px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default">reads</span>, and <span className="clarify-word-pill px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default">visuals</span> — all in one private, organized space made just for you.
        </motion.div>

        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT, delay: captionDelay + 0.55 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
        >
          <InteractiveHoverButton
            className={`${buttonVariants({ size: "lg" })} w-auto`}
            text="Get Started"
            textClassName="font-sans italic"
            showDot={false}
            type="button"
            onClick={handleGetStarted}
          />
        </motion.div>
      </motion.div>

      {/* Mobile Get Started Button - positioned right below the title */}
      <motion.div
        className="md:hidden mt-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: captionDelay }}
        whileTap={{ scale: 0.97 }}
      >
        <InteractiveHoverButton
          className={`${buttonVariants({ size: "default" })} w-auto px-6 py-2`}
          text="Get Started"
          textClassName="font-sans italic text-sm"
          showDot={false}
          type="button"
          onClick={handleGetStarted}
        />
      </motion.div>

      {/* Auth Modal */}
      <GoogleAuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
};
