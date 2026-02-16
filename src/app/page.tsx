import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FileText, CheckCircle, Send } from 'lucide-react'

export default async function Home() {
  const session = await auth()

  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6" />
            <span className="font-bold text-xl">Contract Caddie</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Professional Contract Management for Golf Clubs
          </h1>
          <p className="text-xl text-muted-foreground">
            Streamline your club operations with member agreements, vendor contracts,
            and event waivers. Built specifically for golf clubs and organizations.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/register">Get Started Free</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mt-16 max-w-4xl">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-primary/10">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Create Contracts</h3>
            <p className="text-sm text-muted-foreground">
              Build professional contracts with our easy-to-use editor
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Send className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Send for Signature</h3>
            <p className="text-sm text-muted-foreground">
              Send contracts to recipients via email for e-signature
            </p>
          </div>
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-3 rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Track Progress</h3>
            <p className="text-sm text-muted-foreground">
              Monitor signature status and manage your contracts
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
