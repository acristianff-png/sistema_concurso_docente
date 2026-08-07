import { cn } from '@/utils/cn'

interface StepNumberProps {
  n: number
  tone?: 'teal' | 'coral' | 'paper'
  className?: string
}

const toneClasses: Record<NonNullable<StepNumberProps['tone']>, string> = {
  teal: 'bg-teal-dark text-paper',
  coral: 'bg-coral text-paper',
  paper: 'bg-paper text-teal-dark border border-teal-dark/30',
}

/**
 * Numeração estilo protocolo/documento ("01", "02"...) em Space Mono.
 * Usar apenas onde existe uma ordem real (quesitos do barema, etapas de
 * um pipeline) — nunca como decoração genérica em listas sem ordem.
 */
export function StepNumber({ n, tone = 'teal', className }: StepNumberProps) {
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold',
        toneClasses[tone],
        className,
      )}
      aria-hidden="true"
    >
      {String(n).padStart(2, '0')}
    </span>
  )
}
