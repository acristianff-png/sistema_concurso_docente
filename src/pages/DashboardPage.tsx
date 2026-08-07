import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useEditalAtivo } from '@/hooks/useEdital'
import { useBarema } from '@/hooks/useBarema'
import { useHistorico } from '@/hooks/useHistorico'
import { useSimulacao } from '@/hooks/useSimulacao'
import { EmptyEditalState } from '@/components/layout/EmptyEditalState'
import { StampCircle, ProgressBar, NoticeBox, StepNumber, Badge } from '@/components/brand'
import { totalQuesito } from '@/types/domain'
import { EvolutionChart } from '@/components/dashboard/EvolutionChart'

export function DashboardPage() {
  const { edital, loading: loadingEdital, criarSeedInicial } = useEditalAtivo()
  const { quesitos, loading: loadingBarema } = useBarema(edital?.id ?? null)
  const { historico, loading: loadingHistorico } = useHistorico(edital?.id ?? null)
  const { mostrarProjecao, toggle } = useSimulacao()

  const totais = useMemo(
    () =>
      quesitos.map((q) => ({
        quesito: q,
        confirmado: totalQuesito(q, false),
        projetado: totalQuesito(q, true),
      })),
    [quesitos],
  )

  const tetoGeral = useMemo(() => quesitos.reduce((acc, q) => acc + q.teto, 0), [quesitos])
  const totalGeralConfirmado = useMemo(() => totais.reduce((acc, t) => acc + t.confirmado, 0), [totais])
  const totalGeralProjetado = useMemo(() => totais.reduce((acc, t) => acc + t.projetado, 0), [totais])
  const totalExibido = mostrarProjecao ? totalGeralProjetado : totalGeralConfirmado

  const quesitosNoTeto = totais.filter((t) => t.confirmado >= t.quesito.teto)

  if (loadingEdital) {
    return <p className="font-mono text-sm text-ink/60">Carregando…</p>
  }

  if (!edital) {
    return <EmptyEditalState onSeed={criarSeedInicial} />
  }

  return (
    <div className="flex flex-col gap-10">
      <div>
        <div className="font-mono text-xs uppercase tracking-widest text-coral">{edital.nome}</div>
        <h1 className="font-display text-3xl font-medium text-ink">Painel de pontuação</h1>
      </div>

      <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
        <StampCircle
          size="lg"
          tone="teal"
          value={totalExibido.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
          label={`de ${tetoGeral} pontos`}
        />

        <label className="flex cursor-pointer items-center gap-2 rounded-md border border-ink/20 bg-white px-4 py-2 text-sm">
          <input type="checkbox" checked={mostrarProjecao} onChange={toggle} className="accent-coral" />
          Mostrar projeção (inclui fontes não confirmadas)
        </label>
      </div>

      {loadingBarema ? (
        <p className="font-mono text-sm text-ink/60">Carregando quesitos…</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {totais.map(({ quesito, confirmado, projetado }, idx) => (
            <div key={quesito.id} className="rounded-lg border border-ink/10 bg-white p-4">
              <div className="mb-2 flex items-center gap-2">
                <StepNumber n={idx + 1} tone="teal" />
                <span className="font-sans text-sm font-semibold text-ink">{quesito.nome}</span>
              </div>
              <ProgressBar value={confirmado} max={quesito.teto} projetadoValue={mostrarProjecao ? projetado : undefined} />
              {confirmado >= quesito.teto ? (
                <NoticeBox label="No teto" className="mt-3">
                  Este quesito já está no teto — mais produção aqui não aumenta a pontuação.
                </NoticeBox>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {quesitosNoTeto.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {quesitosNoTeto.map((t) => (
            <Badge key={t.quesito.id} tone="mustard">
              {t.quesito.nome} no teto
            </Badge>
          ))}
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 font-display text-xl font-medium text-ink">Evolução da pontuação</h2>
        {loadingHistorico ? (
          <p className="font-mono text-sm text-ink/60">Carregando histórico…</p>
        ) : historico.length === 0 ? (
          <p className="text-sm text-ink/60">
            Ainda não há histórico registrado. Ele é gerado automaticamente a cada alteração de fonte de
            pontuação — veja a{' '}
            <Link to="/barema" className="text-coral underline">
              página do barema
            </Link>
            .
          </p>
        ) : (
          <EvolutionChart historico={historico} quesitos={quesitos} />
        )}
      </div>
    </div>
  )
}
