import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface NoticeBoxProps {
  children: ReactNode
  label?: string
  className?: string
}

/**
 * Caixa de aviso com borda tracejada e etiqueta mostarda — para avisos
 * como "quesito no teto" ou prazos críticos.
 */
export function NoticeBox({ children, label = 'Atenção', className }: NoticeBoxProps) {
  return (
    <div
      role="note"
      className={cn(
        'relative rounded-md border-2 border-dashed border-mustard bg-mustard/10 px-4 pb-3 pt-4 text-sm text-ink',
        className,
      )}
    >
      <span className="absolute -top-3 left-3 rounded bg-mustard px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink">
        {label}
      </span>
      {children}
    </div>
  )
}
