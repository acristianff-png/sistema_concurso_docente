import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useEstrutura } from '@/hooks/useEstrutura'
import { useToast } from '@/hooks/useToast'
import { QuesitoEditor } from '@/components/estrutura/QuesitoEditor'
import { NovoQuesitoForm } from '@/components/estrutura/NovoQuesitoForm'
import type { Edital } from '@/types/database'

export function EditalEstruturaPage() {
  const { editalId } = useParams<{ editalId: string }>()
  const { showError } = useToast()
  const [edital, setEdital] = useState<Edital | null>(null)
  const [loadingEdital, setLoadingEdital] = useState(true)

  const {
    quesitos,
    loading,
    criarQuesito,
    atualizarQuesito,
    excluirQuesito,
    criarItem,
    atualizarItem,
    excluirItem,
    moverItem,
  } = useEstrutura(editalId ?? null)

  useEffect(() => {
    if (!editalId) return
    setLoadingEdital(true)
    supabase
      .from('editais')
      .select('*')
      .eq('id', editalId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          showError(`Erro ao carregar edital: ${error.message}`)
        } else {
          setEdital(data)
        }
        setLoadingEdital(false)
      })
  }, [editalId, showError])

  const proximaOrdem = quesitos.length > 0 ? Math.max(...quesitos.map((q) => q.ordem)) + 1 : 1

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/editais" className="font-mono text-xs text-coral underline">
          ← voltar para editais
        </Link>
        <div className="mt-1 font-mono text-xs uppercase tracking-widest text-coral">Estrutura do edital</div>
        <h1 className="font-display text-3xl font-medium text-ink">
          {loadingEdital ? 'Carregando…' : (edital?.nome ?? 'Edital não encontrado')}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink/70">
          Quesitos e itens que pontuam neste edital. Mudanças aqui não afetam fontes de pontuação já
          lançadas em outros editais.
        </p>
      </div>

      {loading ? (
        <p className="font-mono text-sm text-ink/60">Carregando estrutura…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {quesitos.map((quesito, idx) => (
            <QuesitoEditor
              key={quesito.id}
              quesito={quesito}
              ordem={idx + 1}
              onAtualizarQuesito={(patch) => atualizarQuesito(quesito.id, patch)}
              onExcluirQuesito={() => excluirQuesito(quesito.id)}
              onCriarItem={(item) => criarItem(quesito.id, item)}
              onAtualizarItem={(itemId, item) => atualizarItem(itemId, item)}
              onExcluirItem={(itemId) => excluirItem(itemId)}
              onMoverItem={(itemId, direcao) => moverItem(quesito.id, itemId, direcao)}
            />
          ))}
        </div>
      )}

      <NovoQuesitoForm onSubmit={(nome, teto) => criarQuesito({ nome, teto, ordem: proximaOrdem })} />
    </div>
  )
}
