import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { KanbanCard } from './KanbanCard'
import type { StatusAcao } from '@/types/database'
import type { AcaoComComentarios } from '@/types/domain'

interface KanbanColumnProps {
  status: StatusAcao
  title: string
  acoes: AcaoComComentarios[]
  quesitoNomePorId: Map<string, string>
  areaNomePorId: Map<string, string>
  onCardClick: (acaoId: string) => void
}

export function KanbanColumn({ status, title, acoes, quesitoNomePorId, areaNomePorId, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id: `column-${status}`, data: { status } })

  return (
    <div className="flex min-w-0 flex-1 flex-col rounded-lg bg-ink/5 p-3">
      <h3 className="mb-3 flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wide text-ink/70">
        {title}
        <span className="rounded-full bg-white px-2 py-0.5 text-ink/60">{acoes.length}</span>
      </h3>

      <SortableContext items={acoes.map((a) => a.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="flex min-h-[4rem] flex-col gap-2">
          {acoes.map((acao) => (
            <KanbanCard
              key={acao.id}
              acao={acao}
              quesitoNome={acao.quesito_id ? quesitoNomePorId.get(acao.quesito_id) : undefined}
              areaNome={acao.area_id ? areaNomePorId.get(acao.area_id) : undefined}
              onClick={() => onCardClick(acao.id)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
