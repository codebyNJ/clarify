"use client"

import { motion } from "framer-motion"

interface SearchInputProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function SearchInput({ searchQuery, onSearchChange }: SearchInputProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="w-full"
    >
      <input
        type="text"
        placeholder="Search my mind..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="text-4xl md:text-5xl font-serif bg-transparent border-none outline-none placeholder:italic placeholder:text-muted-foreground/70 text-foreground/80 font-light w-full"
      />
    </motion.div>
  )
}
