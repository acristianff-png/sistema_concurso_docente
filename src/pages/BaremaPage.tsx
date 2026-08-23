import { useEditalAtivo } from '@/hooks/useEdital'
import { useBarema } from '@/hooks/useBarema'
import { useSimulacao } from '@/hooks/useSimulacao'
import { EmptyEditalState } from '@/components/layout/EmptyEditalState'
import { QuesitoSection } from '@/components/barema/QuesitoSection'

export function BaremaPage() {
  const { edital, loading: loadingEdital, criarSeedInicial } = useEditalAtivo()
  const { quesitos, loading, addFonte, updateFonte, deleteFonte } = useBarema(edital?.id ?? null)
  const { mostrarProjecao, toggle } = useSimulacao()

  if (loadingEdital) {
    return <p className="font-mono text-sm text-ink/60">Carregando…</p>
  }

  if (!edital) {
    return <EmptyEditalState onSeed={criarSeedInicial} />
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-coral">{edital.nome}</div>
          <h1 className="font-display text-3xl font-medium text-ink">Quesitos do barema</h1>
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-ink/20 bg-white px-4 py-2 text-sm">
          <input type="checkbox" checked={mostrarProjecao} onChange={toggle} className="accent-coral" />
          Mostrar projeção
        </label>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando quesitos…</p>
      ) : (
        <div>
          {quesitos.map((quesito, idx) => (
            <QuesitoSection
              key={quesito.id}
              quesito={quesito}
              ordem={idx + 1}
              isLast={idx === quesitos.length - 1}
              mostrarProjecao={mostrarProjecao}
              onAddFonte={addFonte}
              onUpdateFonte={updateFonte}
              onToggleConfirmado={(fonteId, confirmado) => updateFonte(fonteId, { confirmado })}
              onDeleteFonte={deleteFonte}
            />
          ))}
        </div>
      )}
    </div>
  )
}
