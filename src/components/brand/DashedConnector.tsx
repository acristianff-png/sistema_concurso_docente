import { cn } from '@/utils/cn'

interface DashedConnectorProps {
  className?: string
  tone?: 'teal' | 'ink'
}

/**
 * Linha tracejada vertical — o "fio condutor" entre seções, reforçando a
 * leitura de processo contínuo (quesitos do barema, etapas de timeline).
 */
export function DashedConnector({ className, tone = 'teal' }: DashedConnectorProps) {
  return (
    <div
      className={cn(
        'mx-auto w-px flex-1 border-l-2 border-dashed',
        tone === 'teal' ? 'border-teal-dark/40' : 'border-ink/30',
        className,
      )}
      aria-hidden="true"
    />
  )
}
