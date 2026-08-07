import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/useToast'
import type { HistoricoPontuacao } from '@/types/database'

interface UseHistoricoResult {
  historico: HistoricoPontuacao[]
  loading: boolean
  refetch: () => Promise<void>
}

export function useHistorico(editalId: string | null): UseHistoricoResult {
  const [historico, setHistorico] = useState<HistoricoPontuacao[]>([])
  const [loading, setLoading] = useState(true)
  const { showError } = useToast()

  const refetch = useCallback(async () => {
    if (!editalId) {
      setHistorico([])
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('historico_pontuacao')
      .select('*')
      .eq('edital_id', editalId)
      .order('registrado_em', { ascending: true })

    if (error) {
      showError(`Erro ao carregar histórico: ${error.message}`)
    } else {
      setHistorico(data as HistoricoPontuacao[])
    }
    setLoading(false)
  }, [editalId, showError])

  useEffect(() => {
    refetch()
  }, [refetch])

  return { historico, loading, refetch }
}
