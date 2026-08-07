import { useEditalAtivo } from '@/hooks/useEdital'
import { useBarema } from '@/hooks/useBarema'
import { useAreas } from '@/hooks/useAreas'
import { useAcoes } from '@/hooks/useAcoes'
import { useHistorico } from '@/hooks/useHistorico'
import { EmptyEditalState } from '@/components/layout/EmptyEditalState'
import { PontuacaoTimelineChart } from '@/components/historico/PontuacaoTimelineChart'
import { DuplicarEditalForm } from '@/components/historico/DuplicarEditalForm'
import { Button } from '@/components/brand'
import { gerarMemorialMarkdown, baixarArquivoMarkdown } from '@/utils/exportMemorial'

export function HistoricoPage() {
  const { edital, loading: loadingEdital, criarSeedInicial, duplicarParaNovoEdital } = useEditalAtivo()
  const { quesitos } = useBarema(edital?.id ?? null)
  const { areas } = useAreas(edital?.id ?? null)
  const { acoes } = useAcoes()
  const { historico, loading } = useHistorico(edital?.id ?? null)

  if (loadingEdital) {
    return <p className="font-mono text-sm text-ink/60">Carregando…</p>
  }

  if (!edital) {
    return <EmptyEditalState onSeed={criarSeedInicial} />
  }

  function handleExportar() {
    if (!edital) return
    const markdown = gerarMemorialMarkdown(edital, areas, acoes)
    baixarArquivoMarkdown(`memorial-${edital.nome.replace(/\s+/g, '-')}.md`, markdown)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-coral">{edital.nome}</div>
          <h1 className="font-display text-3xl font-medium text-ink">Histórico de evolução</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExportar}>
            Exportar memorial (.md)
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando histórico…</p>
      ) : historico.length === 0 ? (
        <p className="text-sm text-ink/60">Ainda não há histórico registrado.</p>
      ) : (
        <PontuacaoTimelineChart historico={historico} quesitos={quesitos} />
      )}

      <div>
        <h2 className="mb-2 font-display text-lg font-medium text-ink">Novo ciclo de edital</h2>
        <p className="mb-3 max-w-2xl text-sm text-ink/70">
          Quando um novo edital sair, duplique a estrutura de quesitos e itens para começar do zero sem
          perder o histórico deste edital.
        </p>
        <DuplicarEditalForm onDuplicar={duplicarParaNovoEdital} />
      </div>
    </div>
  )
}
