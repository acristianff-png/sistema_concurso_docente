import { useState } from 'react'
import { ProgressBar, Badge } from '@/components/brand'
import { FonteList } from './FonteList'
import { AddFonteForm } from './AddFonteForm'
import { totalItem, type ItemComFontes } from '@/types/domain'
import type { NovaFonte } from '@/hooks/useBarema'
import { cn } from '@/utils/cn'

const MODO_LABEL = {
  carga_horaria: 'carga horária',
  periodo: 'período',
} as const

interface ItemRowProps {
  item: ItemComFontes
  mostrarProjecao: boolean
  onAddFonte: (itemId: string, fonte: NovaFonte) => Promise<void>
  onToggleConfirmado: (fonteId: string, confirmado: boolean) => void
  onDeleteFonte: (fonteId: string) => void
}

export function ItemRow({ item, mostrarProjecao, onAddFonte, onToggleConfirmado, onDeleteFonte }: ItemRowProps) {
  const [expanded, setExpanded] = useState(false)
  const [addingFonte, setAddingFonte] = useState(false)

  const confirmado = totalItem(item, false)
  const projetado = totalItem(item, true)

  return (
    <div className="border-t border-ink/10 py-1.5 first:border-t-0">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          'flex w-full items-center justify-between gap-4 rounded-md px-2.5 py-2 text-left transition-colors',
          expanded ? 'bg-teal-dark/10' : 'hover:bg-teal-dark/5',
        )}
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-teal-dark">
          {item.nome}
          {item.modo_calculo !== 'manual' ? (
            <Badge tone="teal">{MODO_LABEL[item.modo_calculo]}</Badge>
          ) : null}
        </span>
        <span className="flex items-center gap-3">
          <span className="w-32">
            <ProgressBar
              value={confirmado}
              max={item.pontuacao_maxima}
              projetadoValue={mostrarProjecao ? projetado : undefined}
              showLabel={false}
            />
          </span>
          <span className="font-mono text-xs font-bold text-ink/70">
            {(mostrarProjecao ? projetado : confirmado).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} /{' '}
            {item.pontuacao_maxima}
          </span>
          <span className="text-ink/40">{expanded ? '−' : '+'}</span>
        </span>
      </button>

      {expanded ? (
        <div className="ml-3 mt-1 border-l-2 border-teal-dark/20 py-1 pl-4">
          <FonteList fontes={item.fontes_pontuacao} onToggleConfirmado={onToggleConfirmado} onDelete={onDeleteFonte} />

          {addingFonte ? (
            <div className="mt-2">
              <AddFonteForm
                item={item}
                onSubmit={async (fonte) => {
                  await onAddFonte(item.id, fonte)
                  setAddingFonte(false)
                }}
                onCancel={() => setAddingFonte(false)}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setAddingFonte(true)}
              className="mt-2 font-mono text-xs text-coral underline"
            >
              + adicionar fonte
            </button>
          )}
        </div>
      ) : null}
    </div>
  )
}
