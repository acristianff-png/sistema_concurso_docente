import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Button, NoticeBox } from '@/components/brand'
import { parseBaremaCsv, type QuesitoCsv } from '@/utils/parseBaremaCsv'

interface ImportarCsvFormProps {
  onImportar: (nome: string, dataPublicacao: string | null, quesitos: QuesitoCsv[]) => Promise<void>
  onCancel: () => void
}

export function ImportarCsvForm({ onImportar, onCancel }: ImportarCsvFormProps) {
  const [nome, setNome] = useState('')
  const [dataPublicacao, setDataPublicacao] = useState('')
  const [arquivoNome, setArquivoNome] = useState<string | null>(null)
  const [quesitos, setQuesitos] = useState<QuesitoCsv[] | null>(null)
  const [avisos, setAvisos] = useState<string[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function sugerirNome(nomeArquivo: string) {
    return nomeArquivo.replace(/\.csv$/i, '').replace(/[_-]+/g, ' ').trim()
  }

  async function handleArquivo(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    setErro(null)
    setQuesitos(null)
    setAvisos([])
    setArquivoNome(arquivo.name)
    if (!nome.trim()) setNome(sugerirNome(arquivo.name))

    try {
      const texto = await arquivo.text()
      const resultado = parseBaremaCsv(texto)
      setQuesitos(resultado.quesitos)
      setAvisos(resultado.avisos)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao ler o CSV.')
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nome.trim() || !quesitos) return
    setSubmitting(true)
    await onImportar(nome.trim(), dataPublicacao || null, quesitos)
    setSubmitting(false)
  }

  const totalItens = quesitos?.reduce((soma, q) => soma + q.itens.length, 0) ?? 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-dashed border-ink/30 bg-white p-4">
      <h2 className="font-display text-lg font-medium text-ink">Importar edital de um CSV</h2>
      <p className="text-xs text-ink/60">
        Colunas esperadas: Quesito, Nome do Item, Descrição (opcional), Pontuação Unitária, Pontuação Máxima.
        O teto de cada quesito é calculado como a soma das pontuações máximas dos itens dele — confira e
        ajuste depois de importar, se o edital definir um teto diferente.
      </p>

      <label className="flex flex-col gap-1 text-sm">
        Arquivo CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleArquivo}
          className="rounded border border-ink/20 px-2 py-1.5 text-sm"
        />
      </label>

      {erro ? <NoticeBox label="Erro ao ler o arquivo">{erro}</NoticeBox> : null}

      {quesitos ? (
        <div className="rounded border border-ink/10 bg-paper p-3 text-sm">
          <p className="font-medium text-ink">
            {arquivoNome} — {quesitos.length} quesito(s), {totalItens} item(ns)
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-ink/70">
            {quesitos.map((q) => (
              <li key={q.nome}>
                {q.nome} — {q.itens.length} item(ns), teto estimado {q.teto}
              </li>
            ))}
          </ul>
          {avisos.length > 0 ? (
            <NoticeBox label={`${avisos.length} linha(s) ignorada(s)`} className="mt-2">
              <ul className="flex flex-col gap-0.5">
                {avisos.map((aviso, idx) => (
                  <li key={idx}>{aviso}</li>
                ))}
              </ul>
            </NoticeBox>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Nome do edital
          <input
            type="text"
            required
            placeholder="ex.: Edital 2349/2026"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Data de publicação
          <input
            type="date"
            value={dataPublicacao}
            onChange={(e) => setDataPublicacao(e.target.value)}
            className="rounded border border-ink/20 px-2 py-1.5"
          />
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!quesitos || submitting}>
          {submitting ? 'Importando…' : 'Importar edital'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
