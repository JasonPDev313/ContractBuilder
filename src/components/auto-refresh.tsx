'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AutoRefreshProps {
  interval?: number // milliseconds, default 10 seconds
}

export function AutoRefresh({ interval = 10000 }: AutoRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const id = setInterval(() => {
      router.refresh()
    }, interval)

    return () => clearInterval(id)
  }, [interval, router])

  return null
}
