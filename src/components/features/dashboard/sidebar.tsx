import Link from 'next/link'
import { Home, FileText, FileStack, Send, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const routes = [
  {
    label: 'Dashboard',
    icon: Home,
    href: '/dashboard',
  },
  {
    label: 'Generate Contract',
    icon: FileText,
    href: '/contracts',
  },
  {
    label: 'AI Contract Generator',
    icon: Sparkles,
    href: '/ai-generator',
  },
  {
    label: 'Contract Templates',
    icon: FileStack,
    href: '/templates',
  },
  {
    label: 'Sent Contracts',
    icon: Send,
    href: '/contracts/sent',
  },
  {
    label: 'Settings',
    icon: Settings,
    href: '/settings/contracts',
  },
]

export function Sidebar() {
  return (
    <div className="space-y-4 py-4">
      <div className="px-3 py-2">
        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
          Menu
        </h2>
        <div className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <route.icon className="mr-2 h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
