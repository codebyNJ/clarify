"use client"

interface NavigationTabsProps {
  activeTab: "everything" | "spaces" | "serendipity"
  onTabChange: (tab: "everything" | "spaces" | "serendipity") => void
}

export default function NavigationTabs({ activeTab, onTabChange }: NavigationTabsProps) {
  return null
}
