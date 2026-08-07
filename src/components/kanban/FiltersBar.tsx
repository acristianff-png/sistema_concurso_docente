import type { Quesito, AreaTematica, PrioridadeAcao } from '@/types/database'

interface FiltersBarProps {
  quesitos: Quesito[]
  areas: AreaTematica[]
  quesitoId: string | null
  areaId: string | null
  prioridade: PrioridadeAcao | null
  onChange: (patch: { quesitoId?: string | null; areaId?: string | null; prioridade?: PrioridadeAcao | null }) => void
}

export function FiltersBar({ quesitos, areas, quesitoId, areaId, prioridade, onChange }: FiltersBarProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <select
        value={quesitoId ?? ''}
        onChange={(e) => onChange({ quesitoId: e.target.value || null })}
        className="rounded-md border border-ink/20 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">Todos os quesitos</option>
        {quesitos.map((q) => (
          <option key={q.id} value={q.id}>
            {q.nome}
          </option>
        ))}
      </select>

      <select
        value={areaId ?? ''}
        onChange={(e) => onChange({ areaId: e.target.value || null })}
        className="rounded-md border border-ink/20 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">Todas as áreas</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
          </option>
        ))}
      </select>

      <select
        value={prioridade ?? ''}
        onChange={(e) => onChange({ prioridade: (e.target.value || null) as PrioridadeAcao | null })}
        className="rounded-md border border-ink/20 bg-white px-3 py-1.5 text-sm"
      >
        <option value="">Todas as prioridades</option>
        <option value="alta">Alta</option>
        <option value="media">Média</option>
        <option value="baixa">Baixa</option>
      </select>
    </div>
  )
}
