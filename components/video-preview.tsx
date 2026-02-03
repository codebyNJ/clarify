"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { 
  Play, 
  Pause, 
  X, 
  Maximize, 
  Volume2, 
  VolumeX,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  idle: { scale: 1 },
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
// Custom Video Controls Component
// ============================================
const VideoControls = ({
  isPlaying,
  isMuted,
  progress,
  duration,
  buffered,
  onPlayPause,
  onMuteToggle,
  onSeek,
  onFullscreen,
}: {
  isPlaying: boolean;
  isMuted: boolean;
  progress: number;
  duration: number;
  buffered: number;
  onPlayPause: () => void;
  onMuteToggle: () => void;
  onSeek: (time: number) => void;
  onFullscreen: () => void;
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
    >
      {/* Progress Bar */}
      <div 
        className="relative h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const percent = (e.clientX - rect.left) / rect.width;
          onSeek(percent * duration);
        }}
      >
        {/* Buffered */}
        <div 
          className="absolute h-full bg-white/30 rounded-full transition-all duration-300"
          style={{ width: `${bufferedPercent}%` }}
        />
        {/* Progress */}
        <div 
          className="absolute h-full bg-gradient-to-r from-orange-400 to-purple-400 rounded-full transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
        {/* Scrubber */}
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ left: `calc(${progressPercent}% - 8px)` }}
          whileHover={{ scale: 1.2 }}
        />
      </div>

      {/* Controls Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <motion.button
            onClick={onPlayPause}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white" />
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </motion.button>

          {/* Volume */}
          <motion.button
            onClick={onMuteToggle}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5 text-white" />
            ) : (
              <Volume2 className="w-5 h-5 text-white" />
            )}
          </motion.button>

          {/* Time Display */}
          <span className="text-white/80 text-sm font-mono">
            {formatTime(progress)} / {formatTime(duration)}
          </span>
        </div>

        {/* Fullscreen */}
        <motion.button
          onClick={onFullscreen}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Fullscreen"
        >
          <Maximize className="w-5 h-5 text-white" />
        </motion.button>
      </div>
    </motion.div>
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

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
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    // Return focus to trigger
    setTimeout(() => triggerRef.current?.focus(), 100);
  }, []);

  // ============================================
  // Video Control Handlers
  // ============================================
  const handlePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleMuteToggle = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setProgress(time);
    }
  }, []);

  const handleFullscreen = useCallback(() => {
    if (modalRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        modalRef.current.requestFullscreen();
      }
    }
  }, []);

  // ============================================
  // Video Event Handlers
  // ============================================
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setProgress(videoRef.current.currentTime);
      // Update buffered
      if (videoRef.current.buffered.length > 0) {
        setBuffered(videoRef.current.buffered.end(videoRef.current.buffered.length - 1));
      }
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
    }
  }, []);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  }, []);

  // ============================================
  // Controls Visibility
  // ============================================
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  // ============================================
  // Keyboard Shortcuts
  // ============================================
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeModal();
          break;
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
        case 'F':
          handleFullscreen();
          break;
        case 'm':
        case 'M':
          handleMuteToggle();
          break;
        case 'ArrowLeft':
          handleSeek(Math.max(0, progress - 10));
          break;
        case 'ArrowRight':
          handleSeek(Math.min(duration, progress + 10));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, closeModal, handlePlayPause, handleFullscreen, handleMuteToggle, handleSeek, progress, duration]);

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
  // Autoplay on modal open
  // ============================================
  useEffect(() => {
    if (isModalOpen && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        // Autoplay blocked, user needs to interact
        setIsPlaying(false);
      });
    }
  }, [isModalOpen]);

  // ============================================
  // Cleanup
  // ============================================
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // ============================================
  // Render
  // ============================================
  return (
    <>
      {/* ============================================
          Floating Trigger Button (Bottom-Right)
          z-index: 30 - above background, below modal
          ============================================ */}
      <motion.button
        ref={triggerRef}
        className={cn(
          "fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-30",
          "w-[180px] h-[180px] sm:w-[200px] sm:h-[200px] md:w-[220px] md:h-[220px]",
          "rounded-[20px] cursor-pointer",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          "will-change-transform",
          className
        )}
        variants={prefersReducedMotion ? {} : triggerVariants}
        initial="idle"
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
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-40 bg-black/75 backdrop-blur-md"
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
              onMouseMove={showControlsTemporarily}
            >
              {/* Modal Content */}
              <div className="relative w-full h-full max-w-[90vw] max-h-[90vh] rounded-2xl overflow-hidden bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl">
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

                {/* Loading Spinner */}
                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-black/50"
                    >
                      <Loader2 className="w-12 h-12 text-white animate-spin" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Video Player */}
                <video
                  ref={videoRef}
                  src={src}
                  className="w-full h-full object-contain"
                  muted={isMuted}
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleVideoEnd}
                  onWaiting={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onClick={handlePlayPause}
                />

                {/* Custom Controls */}
                <AnimatePresence>
                  {showControls && (
                    <VideoControls
                      isPlaying={isPlaying}
                      isMuted={isMuted}
                      progress={progress}
                      duration={duration}
                      buffered={buffered}
                      onPlayPause={handlePlayPause}
                      onMuteToggle={handleMuteToggle}
                      onSeek={handleSeek}
                      onFullscreen={handleFullscreen}
                    />
                  )}
                </AnimatePresence>

                {/* Keyboard Shortcuts Hint */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: showControls ? 0.6 : 0 }}
                  className="absolute top-4 left-4 text-white/60 text-xs hidden md:block"
                >
                  <span className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded">
                    Space: Play/Pause • M: Mute • F: Fullscreen • Esc: Close
                  </span>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
