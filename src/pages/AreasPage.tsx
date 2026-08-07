import { useEditalAtivo } from '@/hooks/useEdital'
import { useAreas } from '@/hooks/useAreas'
import { useAcoes } from '@/hooks/useAcoes'
import { EmptyEditalState } from '@/components/layout/EmptyEditalState'
import { AreaCard } from '@/components/areas/AreaCard'

export function AreasPage() {
  const { edital, loading: loadingEdital, criarSeedInicial } = useEditalAtivo()
  const {
    areas,
    loading,
    addElemento,
    removeElemento,
    addSugestao,
    aceitarSugestao,
    descartarSugestao,
  } = useAreas(edital?.id ?? null)
  const { acoes } = useAcoes()

  if (loadingEdital) {
    return <p className="font-mono text-sm text-ink/60">Carregando…</p>
  }

  if (!edital) {
    return <EmptyEditalState onSeed={criarSeedInicial} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-coral">{edital.nome}</div>
        <h1 className="font-display text-3xl font-medium text-ink">Qualificação do currículo</h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/70">
          Aderência às três áreas temáticas prioritárias do edital.
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando áreas…</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {areas.map((area) => (
            <AreaCard
              key={area.id}
              area={area}
              acoesVinculadas={acoes.filter((a) => a.area_id === area.id)}
              onAddElemento={(descricao, peso, link) => addElemento(area.id, descricao, peso, link)}
              onRemoveElemento={removeElemento}
              onAddSugestao={(descricao) => addSugestao(area.id, descricao)}
              onAceitarSugestao={(sugestaoId, descricao) => aceitarSugestao(sugestaoId, area.id, descricao)}
              onDescartarSugestao={descartarSugestao}
            />
          ))}
        </div>
      )}
    </div>
  )
}
