import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ItemEditorForm } from './ItemEditorForm'
import type { ItemBarema } from '@/types/database'
import type { NovoItemBarema } from '@/hooks/useEstrutura'

interface ItemEditorRowProps {
  item: ItemBarema
  onUpdate: (item: NovoItemBarema) => Promise<void>
  onDelete: () => Promise<void>
}

export function ItemEditorRow({ item, onUpdate, onDelete }: ItemEditorRowProps) {
  const [editando, setEditando] = useState(false)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  async function handleDelete() {
    const ok = window.confirm(`Remover o item "${item.nome}"? Fontes de pontuação já lançadas nele também somem.`)
    if (!ok) return
    await onDelete()
  }

  if (editando) {
    return (
      <li className="py-2">
        <ItemEditorForm
          initial={{
            nome: item.nome,
            unidade: item.unidade,
            pontuacao_maxima: item.pontuacao_maxima,
            criterio_edital: item.criterio_edital,
          }}
          submitLabel="Salvar"
          onSubmit={async (patch) => {
            await onUpdate(patch)
            setEditando(false)
          }}
          onCancel={() => setEditando(false)}
        />
      </li>
    )
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={
        'flex flex-wrap items-start justify-between gap-2 border-t border-ink/10 bg-white py-2 ' +
        (isDragging ? 'relative z-10 opacity-60' : '')
      }
    >
      <div className="flex min-w-0 flex-1 gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-0.5 cursor-grab touch-none select-none text-ink/40 hover:text-ink/70 active:cursor-grabbing"
          aria-label="Arrastar para reordenar"
        >
          ⠿
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-ink">{item.nome}</p>
          {item.criterio_edital ? <p className="mt-0.5 text-xs text-ink/50">{item.criterio_edital}</p> : null}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs text-ink/60">
          {item.unidade} / teto {item.pontuacao_maxima}
        </span>
        <button type="button" onClick={() => setEditando(true)} className="text-xs text-ink/60 hover:underline">
          editar
        </button>
        <button type="button" onClick={handleDelete} className="text-xs text-coral-dark hover:underline">
          remover
        </button>
      </div>
    </li>
  )
}
