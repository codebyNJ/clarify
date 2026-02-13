"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Play, 
  X, 
  
} from "lucide-react";
import { cn } from "@/lib/utils";
import VideoPlayer from "./ui/video-player";

// ============================================
// Types & Interfaces
// ============================================
interface VideoPreviewProps {
  src: string;
  placeholder?: string;
  className?: string;
  title?: string;
}

// ============================================
// Animation Variants (Framer Motion)
// ============================================
const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const, delay: 0.1 }
  }
};

const modalVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.8,
    y: 100
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1] as const,
      delay: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    y: 50,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] as const }
  }
};

const triggerVariants = {
  idle: { scale: 1, opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, delay: 2.5, ease: [0.4, 0, 0.2, 1] as const }
  },
  hover: { 
    scale: 1.08,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] as const }
  },
  tap: { scale: 0.95 }
};

// ============================================
// Floating Particles Component
// ============================================
const FloatingParticles = ({ isHovered }: { isHovered: boolean }) => {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 3 + 4,
    delay: Math.random() * 2,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden rounded-[20px]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle, rgba(255,200,150,${isHovered ? 0.9 : 0.6}) 0%, rgba(200,150,255,${isHovered ? 0.7 : 0.4}) 100%)`,
            boxShadow: isHovered 
              ? `0 0 ${particle.size * 3}px rgba(255,180,100,0.6)` 
              : `0 0 ${particle.size * 2}px rgba(255,180,100,0.3)`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.4, 1, 0.4],
            scale: isHovered ? [1, 1.3, 1] : [1, 1.1, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// Geometric Rings Animation
// ============================================
const GeometricRings = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="absolute rounded-full border"
          style={{
            width: `${60 + index * 30}%`,
            height: `${60 + index * 30}%`,
            borderColor: `rgba(255, 180, 120, ${0.3 - index * 0.08})`,
            borderWidth: 1,
          }}
          animate={{
            rotate: index % 2 === 0 ? [0, 360] : [360, 0],
            scale: isHovered ? [1, 1.1, 1] : [1, 1.02, 1],
            opacity: isHovered ? [0.4, 0.8, 0.4] : [0.2, 0.4, 0.2],
          }}
          transition={{
            rotate: {
              duration: 20 + index * 5,
              repeat: Infinity,
              ease: "linear",
            },
            scale: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
            opacity: {
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
        />
      ))}
    </div>
  );
};

// ============================================
// Glow Effect Component
// ============================================
const GlowEffect = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <>
      {/* Outer glow */}
      <motion.div
        className="absolute -inset-2 rounded-[24px] pointer-events-none"
        style={{
          background: "radial-gradient(circle at center, rgba(255,150,80,0.3) 0%, rgba(150,100,200,0.2) 50%, transparent 70%)",
          filter: "blur(20px)",
        }}
        animate={{
          opacity: isHovered ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
          scale: isHovered ? [1, 1.1, 1] : [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {/* Inner shimmer */}
      <motion.div
        className="absolute inset-0 rounded-[20px] pointer-events-none overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,200,150,0.1) 100%)",
        }}
        animate={{
          opacity: isHovered ? [0.5, 0.8, 0.5] : [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </>
  );
};

// ============================================
// Main VideoPreview Component
// ============================================
export const VideoPreview = ({ 
  src, 
  placeholder, 
  className,
  title = "Watch Video"
}: VideoPreviewProps) => {
  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // ============================================
  // Modal Open/Close Handlers
  // ============================================
  const openModal = useCallback(() => {
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  }, []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
    // Return focus to trigger
    setTimeout(() => triggerRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal]);

  // ============================================
  // Focus Trap
  // ============================================
  useEffect(() => {
    if (!isModalOpen || !modalRef.current) return;

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    firstElement?.focus();
    window.addEventListener('keydown', handleTabKey);
    return () => window.removeEventListener('keydown', handleTabKey);
  }, [isModalOpen]);

  // ============================================
  // Cleanup
  // ============================================
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // ============================================
  // Render
  // ============================================
  return (
    <div>
      {/* ============================================
          Floating Trigger Button (Bottom-Right)
          z-index: 30 - above background, below modal
          ============================================ */}
      <motion.button
        ref={triggerRef}
        className={cn(
          "fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30",
          "w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px]",
          "rounded-[16px] cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          "will-change-transform",
          className
        )}
        variants={prefersReducedMotion ? {} : triggerVariants}
        initial="idle"
        animate="visible"
        whileHover="hover"
        whileTap="tap"
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onClick={openModal}
        aria-label={title}
        aria-haspopup="dialog"
      >
        {/* Glow Effect */}
        {!prefersReducedMotion && <GlowEffect isHovered={isHovered} />}

        {/* Main Container */}
        <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-gradient-to-br from-black/40 via-black/20 to-black/40 backdrop-blur-sm border border-white/10">
          {/* Placeholder Background */}
          {placeholder && (
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${placeholder})` }}
            />
          )}

          {/* Geometric Rings Animation */}
          {!prefersReducedMotion && <GeometricRings isHovered={isHovered} />}

          {/* Floating Particles */}
          {!prefersReducedMotion && <FloatingParticles isHovered={isHovered} />}

          {/* Center Play Button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="relative"
              animate={{
                scale: isHovered ? 1.1 : 1,
              }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Play button glow */}
              <motion.div
                className="absolute -inset-4 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255,150,80,0.4) 0%, transparent 70%)",
                  filter: "blur(10px)",
                }}
                animate={{
                  opacity: isHovered ? [0.6, 1, 0.6] : [0.3, 0.5, 0.3],
                  scale: isHovered ? [1, 1.2, 1] : [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              {/* Play button */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-lg">
                <Play className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white ml-1" />
              </div>
            </motion.div>
          </div>

          {/* Label */}
          <motion.div
            className="absolute bottom-3 left-0 right-0 text-center"
            animate={{
              opacity: isHovered ? 1 : 0.7,
              y: isHovered ? 0 : 2,
            }}
            transition={{ duration: 0.3 }}
          >
            <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
              {title}
            </span>
          </motion.div>
        </div>
      </motion.button>

      {/* ============================================
          Modal Popup
          z-index: 50 - highest layer
          ============================================ */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <div>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
              onClick={closeModal}
              aria-hidden="true"
            />

            {/* Modal Container */}
            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label="Video Player"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={cn(
                "fixed z-50 inset-4 sm:inset-8 md:inset-12 lg:inset-16",
                "flex items-center justify-center"
              )}
            >
              {/* Modal Content */}
              <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden bg-black/30 backdrop-blur-md border border-white/20 shadow-2xl">
                {/* Close Button */}
                <motion.button
                  className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-black/70 transition-colors"
                  onClick={closeModal}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Close video"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>

                <div className="w-full h-full flex items-center justify-center p-3 sm:p-6">
                  <VideoPlayer src={src} />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
