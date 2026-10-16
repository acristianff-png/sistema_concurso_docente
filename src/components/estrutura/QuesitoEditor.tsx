import { useState, type FormEvent } from 'react'
import { StepNumber, Button } from '@/components/brand'
import { ItemEditorRow } from './ItemEditorRow'
import { ItemEditorForm } from './ItemEditorForm'
import type { QuesitoComItensBarema, NovoItemBarema, NovoQuesito } from '@/hooks/useEstrutura'

interface QuesitoEditorProps {
  quesito: QuesitoComItensBarema
  ordem: number
  onAtualizarQuesito: (patch: Partial<NovoQuesito>) => Promise<void>
  onExcluirQuesito: () => Promise<void>
  onCriarItem: (item: NovoItemBarema) => Promise<void>
  onAtualizarItem: (itemId: string, item: NovoItemBarema) => Promise<void>
  onExcluirItem: (itemId: string) => Promise<void>
  onMoverItem: (itemId: string, direcao: 'up' | 'down') => Promise<void>
}

export function QuesitoEditor({
  quesito,
  ordem,
  onAtualizarQuesito,
  onExcluirQuesito,
  onCriarItem,
  onAtualizarItem,
  onExcluirItem,
  onMoverItem,
}: QuesitoEditorProps) {
  const [editandoQuesito, setEditandoQuesito] = useState(false)
  const [nome, setNome] = useState(quesito.nome)
  const [teto, setTeto] = useState(String(quesito.teto))
  const [adicionandoItem, setAdicionandoItem] = useState(false)

  async function handleSubmitQuesito(e: FormEvent) {
    e.preventDefault()
    const tetoNum = Number(teto.replace(',', '.'))
    if (!nome.trim() || Number.isNaN(tetoNum)) return
    await onAtualizarQuesito({ nome: nome.trim(), teto: tetoNum })
    setEditandoQuesito(false)
  }

  async function handleExcluirQuesito() {
    const ok = window.confirm(
      `Remover o quesito "${quesito.nome}" e todos os ${quesito.itens_barema.length} itens dele? Não dá pra desfazer.`,
    )
    if (!ok) return
    await onExcluirQuesito()
  }

  return (
    <section className="rounded-lg border border-ink/10 bg-white p-4">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <StepNumber n={ordem} tone="teal" />
          {editandoQuesito ? null : (
            <div>
              <h2 className="font-display text-lg font-medium text-ink">{quesito.nome}</h2>
              <p className="font-mono text-xs text-ink/50">teto {quesito.teto}</p>
            </div>
          )}
        </div>
        {!editandoQuesito ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditandoQuesito(true)} className="text-xs text-ink/60 hover:underline">
              editar
            </button>
            <button type="button" onClick={handleExcluirQuesito} className="text-xs text-coral-dark hover:underline">
              remover quesito
            </button>
          </div>
        ) : null}
      </div>

      {editandoQuesito ? (
        <form onSubmit={handleSubmitQuesito} className="mb-3 flex flex-wrap items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            Nome do quesito
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded border border-ink/20 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Teto
            <input
              type="text"
              inputMode="decimal"
              required
              value={teto}
              onChange={(e) => setTeto(e.target.value)}
              className="w-24 rounded border border-ink/20 px-2 py-1.5"
            />
          </label>
          <Button type="submit" size="sm">
            Salvar
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditandoQuesito(false)}>
            Cancelar
          </Button>
        </form>
      ) : null}

      <ul className="flex flex-col">
        {quesito.itens_barema.map((item, idx) => (
          <ItemEditorRow
            key={item.id}
            item={item}
            onUpdate={(patch) => onAtualizarItem(item.id, patch)}
            onDelete={() => onExcluirItem(item.id)}
            onMoveUp={() => onMoverItem(item.id, 'up')}
            onMoveDown={() => onMoverItem(item.id, 'down')}
            isFirst={idx === 0}
            isLast={idx === quesito.itens_barema.length - 1}
          />
        ))}
        {quesito.itens_barema.length === 0 ? (
          <li className="py-2 text-sm text-ink/50">Nenhum item cadastrado neste quesito ainda.</li>
        ) : null}
      </ul>

      {adicionandoItem ? (
        <div className="mt-2">
          <ItemEditorForm
            submitLabel="Adicionar item"
            onSubmit={async (item) => {
              await onCriarItem(item)
              setAdicionandoItem(false)
            }}
            onCancel={() => setAdicionandoItem(false)}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdicionandoItem(true)}
          className="mt-2 font-mono text-xs text-coral underline"
        >
          + adicionar item
        </button>
      )}
    </section>
  )
}
