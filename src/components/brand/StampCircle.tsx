import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface StampCircleProps {
  value: ReactNode
  label?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  tone?: 'teal' | 'coral' | 'ink'
  className?: string
}

const sizeClasses: Record<NonNullable<StampCircleProps['size']>, string> = {
  sm: 'h-16 w-16 text-lg',
  md: 'h-28 w-28 text-3xl',
  lg: 'h-44 w-44 text-5xl',
}

const toneClasses: Record<NonNullable<StampCircleProps['tone']>, string> = {
  teal: 'border-teal-dark text-teal-dark',
  coral: 'border-coral text-coral',
  ink: 'border-ink text-ink',
}

/**
 * Círculo com borda tracejada — o "carimbo" da marca AM Mentoria.
 * Usado para destacar números-chave (pontuação total, contadores).
 */
export function StampCircle({ value, label, size = 'md', tone = 'teal', className }: StampCircleProps) {
  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full border-2 border-dashed font-display font-num font-medium',
          sizeClasses[size],
          toneClasses[tone],
        )}
      >
        {value}
      </div>
      {label ? (
        <span className="font-mono text-xs uppercase tracking-wider text-ink/70">{label}</span>
      ) : null}
    </div>
  )
}
