import { useState, type FormEvent } from 'react'
import { Button } from '@/components/brand'
import { calcularValorPreview } from '@/utils/calculoPontuacao'
import type { ItemBarema } from '@/types/database'
import type { NovaFonte } from '@/hooks/useBarema'

interface AddFonteFormProps {
  item: ItemBarema
  onSubmit: (fonte: NovaFonte) => Promise<void>
  onCancel: () => void
}

export function AddFonteForm({ item, onSubmit, onCancel }: AddFonteFormProps) {
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [horas, setHoras] = useState('')
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [emAndamento, setEmAndamento] = useState(false)
  const [link, setLink] = useState('')
  const [dataReferencia, setDataReferencia] = useState('')
  const [confirmado, setConfirmado] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const horasNumero = Number(horas.replace(',', '.'))
  const preview =
    item.modo_calculo === 'carga_horaria'
      ? calcularValorPreview(item, { horas: horasNumero })
      : item.modo_calculo === 'periodo'
        ? calcularValorPreview(item, { dataInicio, dataFim: emAndamento ? null : dataFim || null })
        : null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!descricao.trim()) return

    setSubmitting(true)

    if (item.modo_calculo === 'carga_horaria') {
      if (Number.isNaN(horasNumero) || horasNumero <= 0) {
        setSubmitting(false)
        return
      }
      await onSubmit({
        descricao: descricao.trim(),
        carga_horaria_horas: horasNumero,
        link: link.trim() || null,
        confirmado,
      })
    } else if (item.modo_calculo === 'periodo') {
      if (!dataInicio) {
        setSubmitting(false)
        return
      }
      await onSubmit({
        descricao: descricao.trim(),
        data_inicio: dataInicio,
        data_fim: emAndamento ? null : dataFim || null,
        link: link.trim() || null,
        confirmado,
      })
    } else {
      const valorNumerico = Number(valor.replace(',', '.'))
      if (Number.isNaN(valorNumerico)) {
        setSubmitting(false)
        return
      }
      await onSubmit({
        descricao: descricao.trim(),
        valor: valorNumerico,
        link: link.trim() || null,
        data_referencia: dataReferencia || null,
        confirmado,
      })
    }

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

      {item.modo_calculo === 'carga_horaria' ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            inputMode="decimal"
            placeholder="Carga horária (horas)"
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            required
            className="w-40 rounded border border-ink/20 px-2 py-1.5 text-sm"
          />
          <span className="font-mono text-xs text-ink/60">
            {item.pontos_por_unidade} pt a cada {item.horas_por_unidade}h
            {preview != null ? ` → ${preview.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} pts` : null}
          </span>
        </div>
      ) : item.modo_calculo === 'periodo' ? (
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Início
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
              className="rounded border border-ink/20 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink/60">
            Fim
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              disabled={emAndamento}
              className="rounded border border-ink/20 px-2 py-1.5 text-sm disabled:opacity-50"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-ink/70">
            <input type="checkbox" checked={emAndamento} onChange={(e) => setEmAndamento(e.target.checked)} className="accent-coral" />
            Em andamento
          </label>
          <span className="font-mono text-xs text-ink/60">
            {item.pontos_por_unidade} pt/{item.unidade_periodo}
            {preview != null ? ` → ${preview.toLocaleString('pt-BR', { maximumFractionDigits: 4 })} pts` : null}
          </span>
        </div>
      ) : (
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
        </div>
      )}

      <input
        type="url"
        placeholder="Link (Drive/Lattes/DOI)"
        value={link}
        onChange={(e) => setLink(e.target.value)}
        className="rounded border border-ink/20 px-2 py-1.5 text-sm"
      />

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
