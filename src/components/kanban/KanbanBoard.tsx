import { DndContext, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { KanbanColumn } from './KanbanColumn'
import type { StatusAcao } from '@/types/database'
import type { AcaoComComentarios } from '@/types/domain'

const COLUMNS: { status: StatusAcao; title: string }[] = [
  { status: 'nao_iniciado', title: 'Não iniciado' },
  { status: 'em_andamento', title: 'Em andamento' },
  { status: 'concluido', title: 'Concluído' },
]

interface KanbanBoardProps {
  acoes: AcaoComComentarios[]
  quesitoNomePorId: Map<string, string>
  areaNomePorId: Map<string, string>
  onCardClick: (acaoId: string) => void
  onMove: (acaoId: string, novoStatus: StatusAcao, novaOrdem: number) => void
}

export function KanbanBoard({ acoes, quesitoNomePorId, areaNomePorId, onCardClick, onMove }: KanbanBoardProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const porColuna = (status: StatusAcao) =>
    acoes.filter((a) => a.status === status).sort((a, b) => a.ordem - b.ordem)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    if (activeId === overId) return

    let targetStatus: StatusAcao
    let targetIndex: number

    if (overId.startsWith('column-')) {
      targetStatus = overId.replace('column-', '') as StatusAcao
      targetIndex = porColuna(targetStatus).length
    } else {
      const overAcao = acoes.find((a) => a.id === overId)
      if (!overAcao) return
      targetStatus = overAcao.status
      targetIndex = porColuna(targetStatus).findIndex((a) => a.id === overId)
    }

    onMove(activeId, targetStatus, targetIndex)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            acoes={porColuna(col.status)}
            quesitoNomePorId={quesitoNomePorId}
            areaNomePorId={areaNomePorId}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </DndContext>
  )
}
