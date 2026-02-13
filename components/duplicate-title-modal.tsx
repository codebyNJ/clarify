"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { AlertCircle, X } from "lucide-react";

interface DuplicateTitleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateTitleModal({
  isOpen,
  onClose,
}: DuplicateTitleModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 400,
              damping: 30,
            }}
            className="bg-card text-card-foreground border border-border shadow-2xl rounded-2xl p-6 w-full max-w-sm relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2" style={{ color: '#E8613A' }}>
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Duplicate Title</h3>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message */}
            <p className="text-muted-foreground mb-6">
              A note with this title already exists. Please use a different title.
            </p>

            {/* Button */}
            <div className="flex items-center justify-end">
              <button
                onClick={onClose}
                className="text-sm font-medium transition-colors hover:text-[#E8613A]"
              >
                OK
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
