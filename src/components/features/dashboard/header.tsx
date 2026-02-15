import { auth } from '@/lib/auth'
import { UserNav } from './user-nav'
import { FileText } from 'lucide-react'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            FormBuilder
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          {session?.user && <UserNav user={session.user} />}
        </div>
      </div>
    </header>
  )
}
