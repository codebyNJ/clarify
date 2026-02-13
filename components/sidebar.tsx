"use client"



import { useEffect, useMemo, useState } from "react"

import { motion } from "framer-motion"

import { Moon, Sun, Settings, Grid2X2, Grid3X3, Grid3X3Icon } from "lucide-react"

import { useTheme } from "next-themes"

import Link from "next/link"

import { useRouter } from "next/navigation"



export default function Sidebar() {

  const { resolvedTheme, setTheme } = useTheme()

  const router = useRouter()

  const [mounted, setMounted] = useState(false)

  const [layoutOpen, setLayoutOpen] = useState(false)

  const layoutOptions = useMemo(
    () =>
      [
        { id: "layout-2", value: "2", Icon: Grid2X2 },
        { id: "layout-3", value: "3", Icon: Grid3X3 },
        { id: "layout-4", value: "4", Icon: Grid3X3Icon },
      ] as const,
    []
  )



  useEffect(() => {

    setMounted(true)

  }, [])



  const toggleTheme = () => {

    setTheme(resolvedTheme === "dark" ? "light" : "dark")

  }

  const setLayout = (layout: "2" | "3" | "4") => {
    try {
      localStorage.setItem("notes_layout", layout)
      window.dispatchEvent(
        new CustomEvent("notesio:layout", { detail: { layout } })
      )
    } catch {
      // ignore
    }
  }



  return (

    <motion.aside

      initial={{ x: -60, opacity: 0 }}

      animate={{ x: 0, opacity: 1 }}

      transition={{ duration: 0.6, ease: "easeOut" }}

      className="fixed left-0 top-0 h-full w-14 flex flex-col items-center py-6 z-10 bg-background/60 backdrop-blur-md border-r border-border"

    >

      {/* Vertical "clarify" text */}

      <div className="flex-1 flex items-start pt-6">

        <Link

          href="/home"

          className="text-muted-foreground text-xl font-serif italic font-medium tracking-wider hover:text-foreground transition-colors"

          style={{

            writingMode: "vertical-rl",

            textOrientation: "mixed",

            transform: "rotate(180deg)",

            letterSpacing: "0.08em",

          }}

        >

          Clarify

        </Link>

      </div>



      {/* Bottom icons */}

      <motion.div

        initial={{ y: 40, opacity: 0 }}

        animate={{ y: 0, opacity: 1 }}

        transition={{ delay: 0.5, duration: 0.6 }}

        className="flex flex-col items-center space-y-5 text-muted-foreground"

      >

        <button type="button" aria-label="Toggle theme" onClick={toggleTheme}>

          {mounted && resolvedTheme === "dark" ? (

            <Sun className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />

          ) : (

            <Moon className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />

          )}

        </button>

        <div className="relative">
          <button
            type="button"
            aria-label="Change notes layout"
            onClick={() => {
              router.push("/notes")
              setLayoutOpen((prev) => !prev)
            }}
            className="hover:text-foreground transition-colors"
          >
            <Grid3X3 className="w-5 h-5" />
          </button>

          {layoutOpen && (
            <div className="absolute left-10 bottom-0 bg-popover border border-border rounded-full shadow-lg px-2 py-2 flex flex-col gap-2">
              {layoutOptions.map(({ id, value, Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={`Set layout ${value}`}
                  onClick={() => {
                    setLayout(value)
                    setLayoutOpen(false)
                  }}
                  className="p-1.5 rounded-full hover:bg-accent transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>

          <Settings className="w-5 h-5 hover:text-foreground transition-colors cursor-pointer" />

        </div>

      </motion.div>

    </motion.aside>

  )

}

