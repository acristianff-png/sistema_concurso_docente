import { useMemo, type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TornEdgeBlockProps {
  children: ReactNode
  tone?: 'teal' | 'coral' | 'mustard'
  edge?: 'bottom' | 'top'
  teeth?: number
  className?: string
}

const toneClasses: Record<NonNullable<TornEdgeBlockProps['tone']>, string> = {
  teal: 'bg-teal-dark text-paper',
  coral: 'bg-coral text-paper',
  mustard: 'bg-mustard text-ink',
}

/**
 * Gera o clip-path de "página arrancada de bloco": borda reta nos três
 * lados, serrilhada em zigue-zague em um deles (bottom por padrão).
 */
function tornClipPath(teeth: number, edge: 'bottom' | 'top'): string {
  const amplitude = 7 // % da altura do bloco
  const teethPoints: string[] = []
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * 100
    const y = i % 2 === 0 ? 0 : amplitude
    teethPoints.push(`${x}% ${edge === 'bottom' ? 100 - y : y}%`)
  }

  const straightTop = edge === 'bottom' ? ['0% 0%', '100% 0%'] : []
  const straightBottom = edge === 'bottom' ? [] : ['100% 100%', '0% 100%']

  const points = edge === 'bottom' ? [...straightTop, ...teethPoints] : [...teethPoints, ...straightBottom]

  return `polygon(${points.join(', ')})`
}

/**
 * Bloco de cor sólida com borda serrilhada, como uma página arrancada de
 * um bloco de anotações. Usar em cabeçalhos de destaque (área temática,
 * resumo executivo) — não em componentes pequenos, o efeito precisa de
 * espaço vertical para ficar legível.
 */
export function TornEdgeBlock({ children, tone = 'teal', edge = 'bottom', teeth = 14, className }: TornEdgeBlockProps) {
  const clipPath = useMemo(() => tornClipPath(teeth, edge), [teeth, edge])

  return (
    <div
      className={cn('px-6 py-8 sm:px-8', toneClasses[tone], className)}
      style={{ clipPath, paddingBottom: edge === 'bottom' ? '2.5rem' : undefined, paddingTop: edge === 'top' ? '2.5rem' : undefined }}
    >
      {children}
    </div>
  )
}
