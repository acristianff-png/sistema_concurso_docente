import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'
import type { NovoItemBarema } from '@/hooks/useEstrutura'

interface ItemEditorFormProps {
  initial?: NovoItemBarema
  submitLabel: string
  onSubmit: (item: NovoItemBarema) => Promise<void>
  onCancel: () => void
}

export function ItemEditorForm({ initial, submitLabel, onSubmit, onCancel }: ItemEditorFormProps) {
  const [nome, setNome] = useState(initial?.nome ?? '')
  const [unidade, setUnidade] = useState(String(initial?.unidade ?? ''))
  const [pontuacaoMaxima, setPontuacaoMaxima] = useState(String(initial?.pontuacao_maxima ?? ''))
  const [criterioEdital, setCriterioEdital] = useState(initial?.criterio_edital ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const unidadeNum = Number(unidade.replace(',', '.'))
    const maximaNum = Number(pontuacaoMaxima.replace(',', '.'))
    if (!nome.trim() || Number.isNaN(unidadeNum) || Number.isNaN(maximaNum)) return

    setSubmitting(true)
    await onSubmit({
      nome: nome.trim(),
      unidade: unidadeNum,
      pontuacao_maxima: maximaNum,
      criterio_edital: criterioEdital.trim() || null,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-dashed border-ink/30 p-3">
      <input
        type="text"
        placeholder="Nome do item (ex.: Artigo completo Qualis A1/A2 — autoria qualificada)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        required
        className="rounded border border-ink/20 px-2 py-1.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink/60">
          Valor unitário
          <input
            type="text"
            inputMode="decimal"
            value={unidade}
            onChange={(e) => setUnidade(e.target.value)}
            required
            className="w-28 rounded border border-ink/20 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink/60">
          Teto do item
          <input
            type="text"
            inputMode="decimal"
            value={pontuacaoMaxima}
            onChange={(e) => setPontuacaoMaxima(e.target.value)}
            required
            className="w-28 rounded border border-ink/20 px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <textarea
        placeholder="Critério do edital (texto que descreve como esse item pontua — opcional, mas ajuda a não precisar abrir o PDF depois)"
        value={criterioEdital}
        onChange={(e) => setCriterioEdital(e.target.value)}
        rows={2}
        className="rounded border border-ink/20 px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Salvando…' : submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
