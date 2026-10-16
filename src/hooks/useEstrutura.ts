import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { ItemBarema, Quesito } from '@/types/database'

export interface QuesitoComItensBarema extends Quesito {
  itens_barema: ItemBarema[]
}

export interface NovoQuesito {
  nome: string
  teto: number
  ordem: number
}

export interface NovoItemBarema {
  nome: string
  unidade: number
  pontuacao_maxima: number
  criterio_edital?: string | null
}

interface UseEstruturaResult {
  quesitos: QuesitoComItensBarema[]
  loading: boolean
  refetch: () => Promise<void>
  criarQuesito: (quesito: NovoQuesito) => Promise<void>
  atualizarQuesito: (id: string, patch: Partial<NovoQuesito>) => Promise<void>
  excluirQuesito: (id: string) => Promise<void>
  criarItem: (quesitoId: string, item: NovoItemBarema) => Promise<void>
  atualizarItem: (id: string, patch: Partial<NovoItemBarema>) => Promise<void>
  excluirItem: (id: string) => Promise<void>
}

/**
 * Estrutura de um edital (quesitos + itens que pontuam), para a tela de
 * gestão de editais — não busca fontes_pontuacao, isso é assunto da página
 * /barema (que trabalha só com o edital ativo).
 */
export function useEstrutura(editalId: string | null): UseEstruturaResult {
  const [quesitos, setQuesitos] = useState<QuesitoComItensBarema[]>([])
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  const refetch = useCallback(async () => {
    if (!editalId) {
      setQuesitos([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('quesitos')
      .select('*, itens_barema(*)')
      .eq('edital_id', editalId)
      .order('ordem', { ascending: true })

    if (error) {
      showError(`Erro ao carregar a estrutura do edital: ${error.message}`)
    } else {
      setQuesitos(data as unknown as QuesitoComItensBarema[])
    }
    setLoading(false)
  }, [editalId, showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const criarQuesito = useCallback(
    async (quesito: NovoQuesito) => {
      if (!editalId) return
      const { error } = await supabase.from('quesitos').insert({ edital_id: editalId, ...quesito })
      if (error) {
        showError(`Erro ao criar quesito: ${error.message}`)
        return
      }
      showSuccess(`Quesito "${quesito.nome}" criado.`)
      await refetch()
    },
    [editalId, refetch, showError, showSuccess],
  )

  const atualizarQuesito = useCallback(
    async (id: string, patch: Partial<NovoQuesito>) => {
      const snapshot = quesitos
      setQuesitos((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)))

      const { error } = await supabase.from('quesitos').update(patch).eq('id', id)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao atualizar quesito: ${error.message}`)
        return
      }
      await refetch()
    },
    [quesitos, refetch, showError],
  )

  const excluirQuesito = useCallback(
    async (id: string) => {
      const snapshot = quesitos
      setQuesitos((prev) => prev.filter((q) => q.id !== id))

      const { error } = await supabase.from('quesitos').delete().eq('id', id)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao excluir quesito: ${error.message}`)
        return
      }
      showSuccess('Quesito excluído.')
      await refetch()
    },
    [quesitos, refetch, showError, showSuccess],
  )

  const criarItem = useCallback(
    async (quesitoId: string, item: NovoItemBarema) => {
      const { error } = await supabase.from('itens_barema').insert({
        quesito_id: quesitoId,
        nome: item.nome,
        unidade: item.unidade,
        pontuacao_maxima: item.pontuacao_maxima,
        criterio_edital: item.criterio_edital ?? null,
      })
      if (error) {
        showError(`Erro ao criar item: ${error.message}`)
        return
      }
      await refetch()
    },
    [refetch, showError],
  )

  const atualizarItem = useCallback(
    async (id: string, patch: Partial<NovoItemBarema>) => {
      const snapshot = quesitos
      setQuesitos((prev) =>
        prev.map((q) => ({
          ...q,
          itens_barema: q.itens_barema.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      )

      const { error } = await supabase.from('itens_barema').update(patch).eq('id', id)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao atualizar item: ${error.message}`)
        return
      }
      await refetch()
    },
    [quesitos, refetch, showError],
  )

  const excluirItem = useCallback(
    async (id: string) => {
      const snapshot = quesitos
      setQuesitos((prev) =>
        prev.map((q) => ({ ...q, itens_barema: q.itens_barema.filter((item) => item.id !== id) })),
      )

      const { error } = await supabase.from('itens_barema').delete().eq('id', id)

      if (error) {
        setQuesitos(snapshot)
        showError(`Erro ao excluir item: ${error.message}`)
        return
      }
      await refetch()
    },
    [quesitos, refetch, showError],
  )

  return {
    quesitos,
    loading,
    refetch,
    criarQuesito,
    atualizarQuesito,
    excluirQuesito,
    criarItem,
    atualizarItem,
    excluirItem,
  }
}
