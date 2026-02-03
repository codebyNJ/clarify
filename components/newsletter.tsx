"use client";

import { motion } from "framer-motion";

const DURATION = 0.3;
const EASE_OUT = "easeOut";

const BG_FADE_DURATION = 0.9;
const TITLE_STAGGER = 0.08;
const TITLE = "Clarify";

export const Newsletter = () => {
  const titleDelay = BG_FADE_DURATION + 0.2;
  const captionDelay = titleDelay + TITLE.length * TITLE_STAGGER + 0.2;

  return (
    <div className="flex overflow-hidden relative flex-col gap-4 justify-center items-center pt-2 w-full h-full short:lg:pt-2 pb-footer-safe-area 2xl:pt-footer-safe-area px-sides short:lg:gap-4 lg:gap-8">
      <div className="w-full flex justify-center pr-16 md:pr-28 lg:pr-40">
        <motion.h1
          className="font-serif text-5xl italic short:lg:text-8xl sm:text-8xl lg:text-9xl text-white"
          initial="hiddefn"
          animate="visible"
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: TITLE_STAGGER, delayChildren: titleDelay }
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

      {/* Caption positioned on the right side of the page */}
      <motion.div
        className="absolute right-8 top-40 font-serif text-2xl italic short:lg:text-4xl sm:text-4xl lg:text-5xl text-white"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT, delay: captionDelay }}
      >
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: captionDelay + 0.05 }}>
          Simplify your mind,
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT, delay: captionDelay + 0.15 }}>
          Amplify your clarity.
        </motion.div>
        <motion.div
          className="mt-8 text-lg font-sans font-normal italic short:lg:text-xl sm:text-xl lg:text-2xl max-w-md"
          style={{ lineHeight: "1.9" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: EASE_OUT, delay: captionDelay + 0.35 }}
        >
          Store your <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default text-white">ideas</span>, <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default text-white">saves</span>, <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default text-white">sparks</span>, <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default text-white">reads</span>, and <span className="px-2 py-0.5 rounded-full bg-primary/20 backdrop-blur-xl border border-border/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 hover:bg-primary/30 hover:border-primary/50 cursor-default text-white">visuals</span> — all in one private, organized space made just for you.
        </motion.div>
      </motion.div>
    </div>
  );
};
