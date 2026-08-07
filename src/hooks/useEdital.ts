import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { Edital } from '@/types/database'

interface UseEditalAtivoResult {
  edital: Edital | null
  loading: boolean
  criarSeedInicial: () => Promise<void>
  duplicarParaNovoEdital: (novoNome: string, dataPublicacao?: string | null) => Promise<void>
  refetch: () => Promise<void>
}

export function useEditalAtivo(): UseEditalAtivoResult {
  const [edital, setEdital] = useState<Edital | null>(null)
  const [loading, setLoading] = useState(true)
  const { showError, showSuccess } = useToast()

  const refetch = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('editais')
      .select('*')
      .eq('ativo', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      showError(`Erro ao carregar edital ativo: ${error.message}`)
    } else {
      setEdital(data)
    }
    setLoading(false)
  }, [showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  const criarSeedInicial = useCallback(async () => {
    const { error } = await supabase.rpc('seed_dados_iniciais')
    if (error) {
      showError(`Erro ao popular dados iniciais: ${error.message}`)
      return
    }
    showSuccess('Dados iniciais carregados.')
    await refetch()
  }, [refetch, showError, showSuccess])

  const duplicarParaNovoEdital = useCallback(
    async (novoNome: string, dataPublicacao?: string | null) => {
      if (!edital) return
      const { error } = await supabase.rpc('duplicar_edital_para_novo', {
        p_edital_origem_id: edital.id,
        p_novo_nome: novoNome,
        p_data_publicacao: dataPublicacao ?? null,
      })
      if (error) {
        showError(`Erro ao duplicar edital: ${error.message}`)
        return
      }
      showSuccess(`Novo edital "${novoNome}" criado a partir da estrutura anterior.`)
      await refetch()
    },
    [edital, refetch, showError, showSuccess],
  )

  return { edital, loading, criarSeedInicial, duplicarParaNovoEdital, refetch }
}
