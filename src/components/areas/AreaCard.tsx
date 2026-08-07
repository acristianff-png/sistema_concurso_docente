import { useState, type FormEvent } from 'react'
import { TornEdgeBlock, StampCircle, Badge, Button } from '@/components/brand'
import { calcularForcaArea, corForForca } from '@/utils/forcaArea'
import type { AreaComDetalhes } from '@/types/domain'
import type { Acao, StatusSugestao } from '@/types/database'

const STATUS_ACAO_TONE = {
  nao_iniciado: 'neutral',
  em_andamento: 'mustard',
  concluido: 'teal',
} as const

const STATUS_ACAO_LABEL = {
  nao_iniciado: 'Não iniciado',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
} as const

const SUGESTAO_TONE: Record<StatusSugestao, 'neutral' | 'mustard' | 'teal'> = {
  sugerida: 'neutral',
  aceita: 'teal',
  descartada: 'neutral',
}

interface AreaCardProps {
  area: AreaComDetalhes
  acoesVinculadas: Acao[]
  onAddElemento: (descricao: string, peso: number, link?: string | null) => Promise<void>
  onRemoveElemento: (elementoId: string) => Promise<void>
  onAddSugestao: (descricao: string) => Promise<void>
  onAceitarSugestao: (sugestaoId: string, descricao: string) => Promise<void>
  onDescartarSugestao: (sugestaoId: string) => Promise<void>
}

export function AreaCard({
  area,
  acoesVinculadas,
  onAddElemento,
  onRemoveElemento,
  onAddSugestao,
  onAceitarSugestao,
  onDescartarSugestao,
}: AreaCardProps) {
  const { score } = calcularForcaArea(area.area_elementos, area.area_sugestoes)
  const tone = corForForca(score)

  const [novoElemento, setNovoElemento] = useState('')
  const [novoPeso, setNovoPeso] = useState('3')
  const [novaSugestao, setNovaSugestao] = useState('')

  async function handleAddElemento(e: FormEvent) {
    e.preventDefault()
    if (!novoElemento.trim()) return
    await onAddElemento(novoElemento.trim(), Number(novoPeso))
    setNovoElemento('')
    setNovoPeso('3')
  }

  async function handleAddSugestao(e: FormEvent) {
    e.preventDefault()
    if (!novaSugestao.trim()) return
    await onAddSugestao(novaSugestao.trim())
    setNovaSugestao('')
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink/10 bg-white">
      <TornEdgeBlock tone={tone} edge="bottom">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-medium">{area.nome}</h2>
          <StampCircle size="sm" tone={tone === 'mustard' ? 'ink' : tone} value={score} label="força" />
        </div>
      </TornEdgeBlock>

      <div className="flex flex-col gap-6 px-5 pb-6 pt-2">
        <section>
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-ink/60">
            Elementos existentes
          </h3>
          <ul className="flex flex-col gap-1.5">
            {area.area_elementos.map((el) => (
              <li key={el.id} className="flex items-center justify-between gap-2 rounded bg-paper px-3 py-1.5 text-sm">
                <span>
                  {el.descricao}
                  {el.link ? (
                    <a href={el.link} target="_blank" rel="noreferrer" className="ml-2 text-xs text-coral underline">
                      link
                    </a>
                  ) : null}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-ink/50">peso {el.peso}</span>
                  <button type="button" onClick={() => onRemoveElemento(el.id)} className="text-xs text-coral-dark hover:underline">
                    remover
                  </button>
                </span>
              </li>
            ))}
            {area.area_elementos.length === 0 ? <li className="text-sm text-ink/50">Nenhum elemento cadastrado.</li> : null}
          </ul>

          <form onSubmit={handleAddElemento} className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Novo elemento"
              value={novoElemento}
              onChange={(e) => setNovoElemento(e.target.value)}
              className="min-w-[10rem] flex-1 rounded border border-ink/20 px-2 py-1.5 text-sm"
            />
            <select value={novoPeso} onChange={(e) => setNovoPeso(e.target.value)} className="rounded border border-ink/20 px-2 py-1.5 text-sm">
              {[1, 2, 3, 4, 5].map((p) => (
                <option key={p} value={p}>
                  peso {p}
                </option>
              ))}
            </select>
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </form>
        </section>

        <section>
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-ink/60">
            Sugestões de melhoria
          </h3>
          <ul className="flex flex-col gap-1.5">
            {area.area_sugestoes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 rounded bg-paper px-3 py-1.5 text-sm">
                <span className="flex items-center gap-2">
                  <Badge tone={SUGESTAO_TONE[s.status]}>{s.status}</Badge>
                  {s.descricao}
                </span>
                {s.status === 'sugerida' ? (
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onAceitarSugestao(s.id, s.descricao)}
                      className="text-xs text-teal-dark hover:underline"
                    >
                      aceitar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDescartarSugestao(s.id)}
                      className="text-xs text-coral-dark hover:underline"
                    >
                      descartar
                    </button>
                  </span>
                ) : null}
              </li>
            ))}
            {area.area_sugestoes.length === 0 ? <li className="text-sm text-ink/50">Nenhuma sugestão ainda.</li> : null}
          </ul>

          <form onSubmit={handleAddSugestao} className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Nova sugestão"
              value={novaSugestao}
              onChange={(e) => setNovaSugestao(e.target.value)}
              className="flex-1 rounded border border-ink/20 px-2 py-1.5 text-sm"
            />
            <Button type="submit" size="sm">
              Adicionar
            </Button>
          </form>
        </section>

        <section>
          <h3 className="mb-2 font-mono text-xs font-bold uppercase tracking-wide text-ink/60">Ações vinculadas</h3>
          <ul className="flex flex-col gap-1.5">
            {acoesVinculadas.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 rounded bg-paper px-3 py-1.5 text-sm">
                <span>{a.titulo}</span>
                <Badge tone={STATUS_ACAO_TONE[a.status]}>{STATUS_ACAO_LABEL[a.status]}</Badge>
              </li>
            ))}
            {acoesVinculadas.length === 0 ? <li className="text-sm text-ink/50">Nenhuma ação vinculada.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  )
}
