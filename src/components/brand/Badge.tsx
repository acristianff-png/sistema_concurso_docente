import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

export type BadgeTone = 'neutral' | 'coral' | 'coral-dark' | 'mustard' | 'teal'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-ink/10 text-ink',
  coral: 'bg-coral text-paper',
  'coral-dark': 'bg-coral-dark text-paper',
  mustard: 'bg-mustard text-ink',
  teal: 'bg-teal-dark text-paper',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wide',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
