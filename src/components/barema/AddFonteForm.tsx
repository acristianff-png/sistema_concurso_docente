import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'

interface AddFonteFormProps {
  onSubmit: (fonte: {
    descricao: string
    valor: number
    link?: string | null
    data_referencia?: string | null
    confirmado: boolean
  }) => Promise<void>
  onCancel: () => void
}

export function AddFonteForm({ onSubmit, onCancel }: AddFonteFormProps) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [link, setLink] = useState('')
  const [dataReferencia, setDataReferencia] = useState('')
  const [confirmado, setConfirmado] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const valorNumerico = Number(valor.replace(',', '.'))
    if (!descricao.trim() || Number.isNaN(valorNumerico)) return

    setSubmitting(true)
    await onSubmit({
      descricao: descricao.trim(),
      valor: valorNumerico,
      link: link.trim() || null,
      data_referencia: dataReferencia || null,
      confirmado,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 rounded-md border border-dashed border-ink/30 p-3">
      <input
        type="text"
        placeholder="Descrição (ex.: Artigo: título completo)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        required
        className="rounded border border-ink/20 px-2 py-1.5 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          inputMode="decimal"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
          className="w-24 rounded border border-ink/20 px-2 py-1.5 text-sm"
        />
        <input
          type="date"
          value={dataReferencia}
          onChange={(e) => setDataReferencia(e.target.value)}
          className="rounded border border-ink/20 px-2 py-1.5 text-sm"
        />
        <input
          type="url"
          placeholder="Link (Drive/Lattes/DOI)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="min-w-[10rem] flex-1 rounded border border-ink/20 px-2 py-1.5 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          checked={confirmado}
          onChange={(e) => setConfirmado(e.target.checked)}
          className="accent-coral"
        />
        Confirmado (desmarque para registrar como projeção)
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Adicionar fonte'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
