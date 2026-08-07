import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Badge, NoticeBox } from '@/components/brand'
import { calcularUrgencia, URGENCIA_LABEL, type Urgencia } from '@/utils/urgencia'
import type { PrioridadeAcao } from '@/types/database'
import type { AcaoComComentarios } from '@/types/domain'

const PRIORIDADE_TONE: Record<PrioridadeAcao, 'neutral' | 'mustard' | 'coral'> = {
  baixa: 'neutral',
  media: 'mustard',
  alta: 'coral',
}

const URGENCIA_TONE: Record<Urgencia, 'neutral' | 'mustard' | 'coral' | 'coral-dark'> = {
  sem_urgencia: 'neutral',
  ate_15_dias: 'mustard',
  ate_7_dias: 'coral',
  vencida: 'coral-dark',
}

interface KanbanCardProps {
  acao: AcaoComComentarios
  quesitoNome?: string
  areaNome?: string
  onClick: () => void
}

export function KanbanCard({ acao, quesitoNome, areaNome, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: acao.id,
    data: { status: acao.status },
  })

  const urgencia = calcularUrgencia(acao.prazo)

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={
        'flex w-full flex-col gap-2 rounded-md border border-ink/10 bg-white p-3 text-left shadow-sm ' +
        (isDragging ? 'opacity-40' : 'hover:border-coral/50')
      }
    >
      <p className="text-sm font-semibold text-ink">{acao.titulo}</p>

      <div className="flex flex-wrap gap-1.5">
        {quesitoNome ? <Badge tone="teal">{quesitoNome}</Badge> : null}
        {areaNome ? <Badge tone="neutral">{areaNome}</Badge> : null}
        <Badge tone={PRIORIDADE_TONE[acao.prioridade]}>{acao.prioridade}</Badge>
        {urgencia !== 'sem_urgencia' ? (
          <Badge tone={URGENCIA_TONE[urgencia]}>{URGENCIA_LABEL[urgencia]}</Badge>
        ) : null}
      </div>

      {!acao.afeta_pontuacao ? (
        <NoticeBox label="Sem impacto" className="py-1.5 text-xs">
          Não altera a pontuação diretamente.
        </NoticeBox>
      ) : acao.impacto_pontos ? (
        <span className="font-mono text-xs text-ink/60">+{acao.impacto_pontos} pts</span>
      ) : null}
    </button>
  )
}
