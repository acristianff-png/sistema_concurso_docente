import { cn } from '@/utils/cn'

interface ProgressBarProps {
  value: number
  max: number
  projetadoValue?: number
  className?: string
  showLabel?: boolean
}

/**
 * Cor migra conforme a proximidade do teto: neutro < 60%, mostarda entre
 * 60% e 90%, coral acima de 90% (quase/no teto). O valor projetado
 * (fontes não confirmadas) aparece como uma faixa pontilhada por cima,
 * sempre visualmente distinta do valor confirmado.
 */
function colorForRatio(ratio: number): string {
  if (ratio >= 0.9) return 'bg-coral'
  if (ratio >= 0.6) return 'bg-mustard'
  return 'bg-teal-dark'
}

export function ProgressBar({ value, max, projetadoValue, className, showLabel = true }: ProgressBarProps) {
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  const ratioProjetado = projetadoValue != null && max > 0 ? Math.min(projetadoValue / max, 1) : null

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink/10">
        {ratioProjetado != null && ratioProjetado > ratio ? (
          <div
            className="absolute inset-y-0 left-0 rounded-full border-2 border-dashed border-coral/50 bg-coral/10"
            style={{ width: `${ratioProjetado * 100}%` }}
          />
        ) : null}
        <div
          className={cn('absolute inset-y-0 left-0 rounded-full transition-all', colorForRatio(ratio))}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      {showLabel ? (
        <div className="mt-1 flex justify-between font-mono text-xs text-ink/60">
          <span className="font-num">
            {value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} / {max.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
          </span>
          <span>{Math.round(ratio * 100)}%</span>
        </div>
      ) : null}
    </div>
  )
}
