import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { HistoricoPontuacao, Quesito } from '@/types/database'

interface EvolutionChartProps {
  historico: HistoricoPontuacao[]
  quesitos: Quesito[]
}

/**
 * historico_pontuacao guarda uma linha por quesito a cada recálculo (não
 * um total já somado). Para desenhar a evolução do TOTAL, reconstruímos
 * uma timeline: em cada timestamp registrado, propagamos o último valor
 * conhecido de cada quesito ("carry-forward") e somamos.
 */
function buildTotalSeries(historico: HistoricoPontuacao[], quesitoIds: string[]) {
  const porTimestamp = [...new Set(historico.map((h) => h.registrado_em))].sort()
  const ultimoValor = new Map<string, number>()
  quesitoIds.forEach((id) => ultimoValor.set(id, 0))

  return porTimestamp.map((ts) => {
    const doMomento = historico.filter((h) => h.registrado_em === ts)
    doMomento.forEach((h) => ultimoValor.set(h.quesito_id, h.pontuacao))

    const total = quesitoIds.reduce((acc, id) => acc + (ultimoValor.get(id) ?? 0), 0)

    return {
      date: new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: Math.round(total * 100) / 100,
    }
  })
}

export function EvolutionChart({ historico, quesitos }: EvolutionChartProps) {
  const data = useMemo(
    () => buildTotalSeries(historico, quesitos.map((q) => q.id)),
    [historico, quesitos],
  )

  return (
    <div className="h-64 w-full rounded-lg border border-ink/10 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#14201C" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} stroke="#14201C" />
          <YAxis tick={{ fontSize: 11, fontFamily: 'Space Mono' }} stroke="#14201C" width={40} />
          <Tooltip
            contentStyle={{ fontFamily: 'Work Sans', fontSize: 13, borderRadius: 8 }}
            formatter={(value) => [value, 'Pontuação total']}
          />
          <Line type="monotone" dataKey="total" stroke="#D2551F" strokeWidth={2.5} dot={{ r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
