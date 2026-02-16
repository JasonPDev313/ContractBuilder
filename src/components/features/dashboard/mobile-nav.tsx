'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Home, FileText, FileStack, Send, Settings, Sparkles, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const routes = [
  { label: 'Dashboard', icon: Home, href: '/dashboard' },
  { label: 'Generate Contract', icon: FileText, href: '/contracts' },
  { label: 'AI Template Builder', icon: Sparkles, href: '/ai-generator' },
  { label: 'Contract Templates', icon: FileStack, href: '/templates' },
  { label: 'Sent Contracts', icon: Send, href: '/contracts/sent' },
  { label: 'Team', icon: Users, href: '/settings/users' },
  { label: 'Settings', icon: Settings, href: '/settings/contracts' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const drawer = open ? (
    <div className="fixed inset-0" style={{ zIndex: 9999 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => setOpen(false)}
      />
      {/* Panel */}
      <div className="absolute inset-y-0 left-0 w-72 bg-background shadow-lg">
        <div className="flex items-center justify-between p-6 pb-4">
          <span className="font-bold text-lg">Menu</span>
          <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="px-6 space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
                pathname === route.href && 'bg-accent text-accent-foreground'
              )}
            >
              <route.icon className="mr-3 h-4 w-4" />
              {route.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  ) : null

  return (
    <div className="md:hidden mr-2">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>
      {mounted && drawer && createPortal(drawer, document.body)}
    </div>
  )
}
