'use client'

import { useState } from 'react'
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
  const pathname = usePathname()

  return (
    <div className="md:hidden">
      <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
        <span className="sr-only">Open menu</span>
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-background p-6 shadow-lg animate-in slide-in-from-left">
            <div className="flex items-center justify-between mb-6">
              <span className="font-bold text-lg">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="space-y-1">
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
        </>
      )}
    </div>
  )
}
