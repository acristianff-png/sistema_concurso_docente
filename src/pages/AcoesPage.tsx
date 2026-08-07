import { useMemo, useState } from 'react'
import { useEditalAtivo } from '@/hooks/useEdital'
import { useBarema } from '@/hooks/useBarema'
import { useAreas } from '@/hooks/useAreas'
import { useAcoes } from '@/hooks/useAcoes'
import { EmptyEditalState } from '@/components/layout/EmptyEditalState'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { AcaoModal } from '@/components/kanban/AcaoModal'
import { FiltersBar } from '@/components/kanban/FiltersBar'
import { NewAcaoForm } from '@/components/kanban/NewAcaoForm'
import { Button } from '@/components/brand'
import type { PrioridadeAcao } from '@/types/database'

export function AcoesPage() {
  const { edital, loading: loadingEdital, criarSeedInicial } = useEditalAtivo()
  const { quesitos } = useBarema(edital?.id ?? null)
  const { areas } = useAreas(edital?.id ?? null)
  const { acoes, loading, createAcao, updateAcao, deleteAcao, moverAcao, addComentario } = useAcoes()

  const [filtroQuesito, setFiltroQuesito] = useState<string | null>(null)
  const [filtroArea, setFiltroArea] = useState<string | null>(null)
  const [filtroPrioridade, setFiltroPrioridade] = useState<PrioridadeAcao | null>(null)
  const [acaoSelecionadaId, setAcaoSelecionadaId] = useState<string | null>(null)
  const [criandoAcao, setCriandoAcao] = useState(false)

  const quesitoNomePorId = useMemo(() => new Map(quesitos.map((q) => [q.id, q.nome])), [quesitos])
  const areaNomePorId = useMemo(() => new Map(areas.map((a) => [a.id, a.nome])), [areas])

  const acoesFiltradas = useMemo(
    () =>
      acoes.filter(
        (a) =>
          (!filtroQuesito || a.quesito_id === filtroQuesito) &&
          (!filtroArea || a.area_id === filtroArea) &&
          (!filtroPrioridade || a.prioridade === filtroPrioridade),
      ),
    [acoes, filtroQuesito, filtroArea, filtroPrioridade],
  )

  const acaoSelecionada = acoes.find((a) => a.id === acaoSelecionadaId) ?? null

  if (loadingEdital) {
    return <p className="font-mono text-sm text-ink/60">Carregando…</p>
  }

  if (!edital) {
    return <EmptyEditalState onSeed={criarSeedInicial} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-coral">{edital.nome}</div>
          <h1 className="font-display text-3xl font-medium text-ink">Plano de ação</h1>
        </div>
        <Button onClick={() => setCriandoAcao(true)}>+ Nova ação</Button>
      </div>

      <FiltersBar
        quesitos={quesitos}
        areas={areas}
        quesitoId={filtroQuesito}
        areaId={filtroArea}
        prioridade={filtroPrioridade}
        onChange={(patch) => {
          if ('quesitoId' in patch) setFiltroQuesito(patch.quesitoId ?? null)
          if ('areaId' in patch) setFiltroArea(patch.areaId ?? null)
          if ('prioridade' in patch) setFiltroPrioridade(patch.prioridade ?? null)
        }}
      />

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando ações…</p>
      ) : (
        <KanbanBoard
          acoes={acoesFiltradas}
          quesitoNomePorId={quesitoNomePorId}
          areaNomePorId={areaNomePorId}
          onCardClick={setAcaoSelecionadaId}
          onMove={moverAcao}
        />
      )}

      {acaoSelecionada ? (
        <AcaoModal
          acao={acaoSelecionada}
          quesitoNome={acaoSelecionada.quesito_id ? quesitoNomePorId.get(acaoSelecionada.quesito_id) : undefined}
          areaNome={acaoSelecionada.area_id ? areaNomePorId.get(acaoSelecionada.area_id) : undefined}
          onClose={() => setAcaoSelecionadaId(null)}
          onUpdate={(patch) => updateAcao(acaoSelecionada.id, patch)}
          onDelete={() => deleteAcao(acaoSelecionada.id)}
          onAddComentario={(texto) => addComentario(acaoSelecionada.id, texto)}
        />
      ) : null}

      {criandoAcao ? (
        <NewAcaoForm
          quesitos={quesitos}
          areas={areas}
          onCreate={createAcao}
          onClose={() => setCriandoAcao(false)}
        />
      ) : null}
    </div>
  )
}
