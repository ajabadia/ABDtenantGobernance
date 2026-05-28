"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { Search, Check, ChevronDown } from "lucide-react"

export interface IndustrialSelectSearchItem {
  id: string
  label: string
  subLabel?: string
}

interface IndustrialSelectSearchProps {
  items: IndustrialSelectSearchItem[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  noResultsLabel?: string
  ariaLabel?: string
}

export function IndustrialSelectSearch({
  items,
  value,
  onChange,
  placeholder = "Search...",
  noResultsLabel = "No results",
  ariaLabel,
}: IndustrialSelectSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedItem = useMemo(() => items.find((i) => i.id === value), [items, value])

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          (i.subLabel && i.subLabel.toLowerCase().includes(query.toLowerCase()))
      ),
    [items, query]
  )

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-4 bg-secondary/30 border border-border focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs outline-none text-foreground rounded-none flex items-center justify-between gap-2"
      >
        <span className={selectedItem ? "text-foreground" : "text-muted-foreground"}>
          {selectedItem ? selectedItem.label : placeholder}
        </span>
        <ChevronDown size={14} className="text-muted-foreground shrink-0" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border shadow-xl rounded-none max-h-64 flex flex-col">
          {/* Search input */}
          <div className="flex items-center gap-2 p-2 border-b border-border">
            <Search size={14} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent border-none focus:ring-0 text-xs text-foreground placeholder:text-muted-foreground outline-none"
              autoFocus
            />
          </div>

          {/* Items list */}
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 ? (
              <div className="p-4 text-center font-mono text-[10px] text-muted-foreground uppercase">
                {noResultsLabel}
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.label}
                  onClick={() => {
                    onChange(item.id)
                    setOpen(false)
                    setQuery("")
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-primary/[0.03] ${
                    item.id === value ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-sans text-xs font-bold text-foreground truncate">{item.label}</div>
                    {item.subLabel && (
                      <div className="font-mono text-[9px] text-muted-foreground truncate">{item.subLabel}</div>
                    )}
                  </div>
                  {item.id === value && (
                    <Check size={14} className="text-primary shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
