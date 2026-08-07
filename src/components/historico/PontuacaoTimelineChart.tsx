import { useMemo } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import type { HistoricoPontuacao, Quesito } from '@/types/database'

interface PontuacaoTimelineChartProps {
  historico: HistoricoPontuacao[]
  quesitos: Quesito[]
}

const CORES = ['#0B3B32', '#D2551F', '#F4C430', '#A8410F', '#14201C']

/** Mesma técnica de carry-forward do EvolutionChart, mas mantendo uma série por quesito além do total. */
export function PontuacaoTimelineChart({ historico, quesitos }: PontuacaoTimelineChartProps) {
  const { data, quesitoKeys } = useMemo(() => {
    const timestamps = [...new Set(historico.map((h) => h.registrado_em))].sort()
    const ultimoValor = new Map<string, number>()
    quesitos.forEach((q) => ultimoValor.set(q.id, 0))

    const rows = timestamps.map((ts) => {
      historico.filter((h) => h.registrado_em === ts).forEach((h) => ultimoValor.set(h.quesito_id, h.pontuacao))

      const row: Record<string, number | string> = {
        date: new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      }
      let total = 0
      quesitos.forEach((q) => {
        const v = ultimoValor.get(q.id) ?? 0
        row[q.nome] = Math.round(v * 100) / 100
        total += v
      })
      row.Total = Math.round(total * 100) / 100
      return row
    })

    return { data: rows, quesitoKeys: quesitos.map((q) => q.nome) }
  }, [historico, quesitos])

  return (
    <div className="h-96 w-full rounded-lg border border-ink/10 bg-white p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid stroke="#14201C" strokeOpacity={0.08} vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fontFamily: 'Space Mono' }} stroke="#14201C" />
          <YAxis tick={{ fontSize: 11, fontFamily: 'Space Mono' }} stroke="#14201C" width={40} />
          <Tooltip contentStyle={{ fontFamily: 'Work Sans', fontSize: 13, borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontFamily: 'Work Sans', fontSize: 12 }} />
          <Line type="monotone" dataKey="Total" stroke="#D2551F" strokeWidth={3} dot={{ r: 2 }} />
          {quesitoKeys.map((nome, idx) => (
            <Line
              key={nome}
              type="monotone"
              dataKey={nome}
              stroke={CORES[idx % CORES.length]}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
