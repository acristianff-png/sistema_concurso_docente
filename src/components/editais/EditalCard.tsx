import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button } from '@/components/brand'
import { EditarEditalForm } from './EditarEditalForm'
import type { Edital } from '@/types/database'

interface EditalCardProps {
  edital: Edital
  onAtivar: () => Promise<void>
  onAtualizar: (patch: { nome: string; data_publicacao: string | null; observacoes: string | null }) => Promise<void>
  onExcluir: () => Promise<void>
}

export function EditalCard({ edital, onAtivar, onAtualizar, onExcluir }: EditalCardProps) {
  const [editando, setEditando] = useState(false)

  async function handleExcluir() {
    const ok = window.confirm(
      `Excluir "${edital.nome}"? Isso remove em cascata todos os quesitos, itens, fontes de pontuação, áreas e ações vinculados a este edital. Não dá pra desfazer.`,
    )
    if (!ok) return
    await onExcluir()
  }

  if (editando) {
    return (
      <div className="rounded-lg border border-ink/10 bg-white p-4">
        <EditarEditalForm
          edital={edital}
          onSubmit={async (patch) => {
            await onAtualizar(patch)
            setEditando(false)
          }}
          onCancel={() => setEditando(false)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ink/10 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-medium text-ink">{edital.nome}</h2>
            {edital.ativo ? <Badge tone="teal">Ativo</Badge> : null}
          </div>
          {edital.data_publicacao ? (
            <p className="font-mono text-xs text-ink/50">Publicado em {edital.data_publicacao}</p>
          ) : null}
        </div>
      </div>

      {edital.observacoes ? <p className="text-sm text-ink/70">{edital.observacoes}</p> : null}

      <div className="mt-1 flex flex-wrap gap-2">
        {!edital.ativo ? (
          <Button size="sm" onClick={onAtivar}>
            Ativar
          </Button>
        ) : null}
        <Link to={`/editais/${edital.id}`}>
          <Button size="sm" variant="secondary">
            Editar estrutura
          </Button>
        </Link>
        <Button size="sm" variant="ghost" onClick={() => setEditando(true)}>
          Editar dados
        </Button>
        <Button size="sm" variant="danger" onClick={handleExcluir}>
          Excluir
        </Button>
      </div>
    </div>
  )
}
