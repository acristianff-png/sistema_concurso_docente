import { useState } from 'react'
import { useEditais } from '@/hooks/useEditais'
import { Button } from '@/components/brand'
import { EditalCard } from '@/components/editais/EditalCard'
import { NovoEditalForm } from '@/components/editais/NovoEditalForm'

export function EditaisPage() {
  const { editais, loading, criarEdital, atualizarEdital, ativarEdital, excluirEdital, duplicarEdital } =
    useEditais()
  const [criando, setCriando] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-coral">Gestão</div>
          <h1 className="font-display text-3xl font-medium text-ink">Editais</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink/70">
            Cada edital tem sua própria estrutura de quesitos e itens que pontuam. Só um fica ativo por
            vez — é o que aparece no Dashboard, no Barema e no Histórico.
          </p>
        </div>
        {!criando ? <Button onClick={() => setCriando(true)}>+ Novo edital</Button> : null}
      </div>

      {criando ? (
        <NovoEditalForm
          editaisExistentes={editais}
          onCriarEmBranco={(nome, dataPublicacao, observacoes) =>
            criarEdital({ nome, data_publicacao: dataPublicacao, observacoes })
          }
          onDuplicar={duplicarEdital}
          onClose={() => setCriando(false)}
        />
      ) : null}

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando editais…</p>
      ) : editais.length === 0 ? (
        <p className="text-sm text-ink/60">Nenhum edital cadastrado ainda. Crie o primeiro acima.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {editais.map((edital) => (
            <EditalCard
              key={edital.id}
              edital={edital}
              onAtivar={() => ativarEdital(edital.id)}
              onAtualizar={(patch) => atualizarEdital(edital.id, patch)}
              onExcluir={() => excluirEdital(edital.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
