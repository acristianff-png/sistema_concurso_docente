import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'
import type { NovaAcao } from '@/hooks/useAcoes'
import type { Quesito, AreaTematica, PrioridadeAcao } from '@/types/database'

interface NewAcaoFormProps {
  quesitos: Quesito[]
  areas: AreaTematica[]
  onCreate: (acao: NovaAcao) => Promise<void>
  onClose: () => void
}

export function NewAcaoForm({ quesitos, areas, onCreate, onClose }: NewAcaoFormProps) {
  const [titulo, setTitulo] = useState('')
  const [quesitoId, setQuesitoId] = useState('')
  const [areaId, setAreaId] = useState('')
  const [prioridade, setPrioridade] = useState<PrioridadeAcao>('media')
  const [prazo, setPrazo] = useState('')
  const [afetaPontuacao, setAfetaPontuacao] = useState(true)
  const [impacto, setImpacto] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) return
    setSubmitting(true)
    await onCreate({
      titulo: titulo.trim(),
      quesito_id: quesitoId || null,
      area_id: areaId || null,
      prioridade,
      prazo: prazo || null,
      afeta_pontuacao: afetaPontuacao,
      impacto_pontos: afetaPontuacao && impacto ? Number(impacto.replace(',', '.')) : null,
    })
    setSubmitting(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-3 rounded-lg bg-paper p-6 shadow-xl"
      >
        <h2 className="font-display text-xl font-medium text-ink">Nova ação</h2>

        <input
          type="text"
          required
          placeholder="Título"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1.5 text-sm"
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={quesitoId} onChange={(e) => setQuesitoId(e.target.value)} className="rounded border border-ink/20 px-2 py-1.5 text-sm">
            <option value="">Sem quesito</option>
            {quesitos.map((q) => (
              <option key={q.id} value={q.id}>
                {q.nome}
              </option>
            ))}
          </select>
          <select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="rounded border border-ink/20 px-2 py-1.5 text-sm">
            <option value="">Sem área</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          <select
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value as PrioridadeAcao)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm"
          >
            <option value="baixa">Prioridade baixa</option>
            <option value="media">Prioridade média</option>
            <option value="alta">Prioridade alta</option>
          </select>
          <input
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={afetaPontuacao} onChange={(e) => setAfetaPontuacao(e.target.checked)} className="accent-coral" />
          Afeta pontuação
        </label>

        {afetaPontuacao ? (
          <input
            type="text"
            inputMode="decimal"
            placeholder="Impacto em pontos (opcional)"
            value={impacto}
            onChange={(e) => setImpacto(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5 text-sm"
          />
        ) : null}

        <div className="mt-2 flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Criando…' : 'Criar ação'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  )
}
