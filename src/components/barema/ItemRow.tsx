import { useState } from 'react'
import { ProgressBar } from '@/components/brand'
import { FonteList } from './FonteList'
import { AddFonteForm } from './AddFonteForm'
import { totalItem, type ItemComFontes } from '@/types/domain'
import type { NovaFonte } from '@/hooks/useBarema'

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
    <div className="border-t border-ink/10 py-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-medium text-ink">{item.nome}</span>
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
        <div className="mt-3 pl-1">
          <FonteList fontes={item.fontes_pontuacao} onToggleConfirmado={onToggleConfirmado} onDelete={onDeleteFonte} />

          {addingFonte ? (
            <div className="mt-2">
              <AddFonteForm
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
