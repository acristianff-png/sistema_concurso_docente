export type StatusAcao = 'nao_iniciado' | 'em_andamento' | 'concluido'
export type PrioridadeAcao = 'baixa' | 'media' | 'alta'
export type StatusSugestao = 'sugerida' | 'aceita' | 'descartada'

export interface Edital {
  id: string
  user_id: string
  nome: string
  ativo: boolean
  data_publicacao: string | null
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Quesito {
  id: string
  edital_id: string
  ordem: number
  nome: string
  teto: number
  created_at: string
  updated_at: string
}

export interface ItemBarema {
  id: string
  quesito_id: string
  nome: string
  unidade: number
  pontuacao_maxima: number
  created_at: string
  updated_at: string
}

export interface FontePontuacao {
  id: string
  item_id: string
  descricao: string
  valor: number
  link: string | null
  data_referencia: string | null
  confirmado: boolean
  created_at: string
  updated_at: string
}

export interface AreaTematica {
  id: string
  edital_id: string
  nome: string
  created_at: string
  updated_at: string
}

export interface AreaElemento {
  id: string
  area_id: string
  descricao: string
  peso: number
  link: string | null
  created_at: string
  updated_at: string
}

export interface AreaSugestao {
  id: string
  area_id: string
  descricao: string
  status: StatusSugestao
  created_at: string
  updated_at: string
}

export interface Acao {
  id: string
  user_id: string
  titulo: string
  descricao: string | null
  quesito_id: string | null
  area_id: string | null
  afeta_pontuacao: boolean
  impacto_pontos: number | null
  status: StatusAcao
  prioridade: PrioridadeAcao
  prazo: string | null
  ordem: number
  created_at: string
  updated_at: string
}

export interface AcaoComentario {
  id: string
  acao_id: string
  texto: string
  created_at: string
}

export interface HistoricoPontuacao {
  id: string
  user_id: string
  edital_id: string
  quesito_id: string
  pontuacao: number
  registrado_em: string
}

// Abaixo, os tipos de Tables são escritos por extenso (Row/Insert/Update
// como literais próprios, sem reaproveitar as interfaces acima via
// genéricos como Partial<T>). O postgrest-js 2.112 só consegue inferir
// corretamente os tipos de .insert()/.update()/.rpc() quando cada tabela
// é um literal isolado — qualquer indireção via tipo nomeado ou utilitário
// genérico (Partial<T>, um alias Table<Row>, etc.) faz a inferência
// colapsar silenciosamente para `never`. É verboso, mas é o mesmo formato
// que `supabase gen types typescript` gera.
export interface Database {
  public: {
    Tables: {
      editais: {
        Row: {
          id: string
          user_id: string
          nome: string
          ativo: boolean
          data_publicacao: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          nome: string
          ativo?: boolean
          data_publicacao?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          ativo?: boolean
          data_publicacao?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      quesitos: {
        Row: {
          id: string
          edital_id: string
          ordem: number
          nome: string
          teto: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          edital_id: string
          ordem: number
          nome: string
          teto: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          edital_id?: string
          ordem?: number
          nome?: string
          teto?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      itens_barema: {
        Row: {
          id: string
          quesito_id: string
          nome: string
          unidade: number
          pontuacao_maxima: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          quesito_id: string
          nome: string
          unidade?: number
          pontuacao_maxima: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          quesito_id?: string
          nome?: string
          unidade?: number
          pontuacao_maxima?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      fontes_pontuacao: {
        Row: {
          id: string
          item_id: string
          descricao: string
          valor: number
          link: string | null
          data_referencia: string | null
          confirmado: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          descricao: string
          valor?: number
          link?: string | null
          data_referencia?: string | null
          confirmado?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          descricao?: string
          valor?: number
          link?: string | null
          data_referencia?: string | null
          confirmado?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      areas_tematicas: {
        Row: {
          id: string
          edital_id: string
          nome: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          edital_id: string
          nome: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          edital_id?: string
          nome?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      area_elementos: {
        Row: {
          id: string
          area_id: string
          descricao: string
          peso: number
          link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_id: string
          descricao: string
          peso: number
          link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_id?: string
          descricao?: string
          peso?: number
          link?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      area_sugestoes: {
        Row: {
          id: string
          area_id: string
          descricao: string
          status: StatusSugestao
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          area_id: string
          descricao: string
          status?: StatusSugestao
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          area_id?: string
          descricao?: string
          status?: StatusSugestao
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      acoes: {
        Row: {
          id: string
          user_id: string
          titulo: string
          descricao: string | null
          quesito_id: string | null
          area_id: string | null
          afeta_pontuacao: boolean
          impacto_pontos: number | null
          status: StatusAcao
          prioridade: PrioridadeAcao
          prazo: string | null
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          titulo: string
          descricao?: string | null
          quesito_id?: string | null
          area_id?: string | null
          afeta_pontuacao?: boolean
          impacto_pontos?: number | null
          status?: StatusAcao
          prioridade?: PrioridadeAcao
          prazo?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          titulo?: string
          descricao?: string | null
          quesito_id?: string | null
          area_id?: string | null
          afeta_pontuacao?: boolean
          impacto_pontos?: number | null
          status?: StatusAcao
          prioridade?: PrioridadeAcao
          prazo?: string | null
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      acao_comentarios: {
        Row: {
          id: string
          acao_id: string
          texto: string
          created_at: string
        }
        Insert: {
          id?: string
          acao_id: string
          texto: string
          created_at?: string
        }
        Update: {
          id?: string
          acao_id?: string
          texto?: string
          created_at?: string
        }
        Relationships: []
      }
      // Somente leitura pelo client: linhas inseridas apenas pelo trigger
      // do banco (ver migration 20260807120002). A política RLS (select-only)
      // é o que de fato impede escrita — Insert/Update aqui só existem para
      // satisfazer o shape genérico exigido pelo postgrest-js.
      historico_pontuacao: {
        Row: {
          id: string
          user_id: string
          edital_id: string
          quesito_id: string
          pontuacao: number
          registrado_em: string
        }
        Insert: {
          id?: string
          user_id: string
          edital_id: string
          quesito_id: string
          pontuacao: number
          registrado_em?: string
        }
        Update: {
          id?: string
          user_id?: string
          edital_id?: string
          quesito_id?: string
          pontuacao?: number
          registrado_em?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      seed_dados_iniciais: {
        Args: Record<string, never>
        Returns: void
      }
      duplicar_edital_para_novo: {
        Args: {
          p_edital_origem_id: string
          p_novo_nome: string
          p_data_publicacao?: string | null
        }
        Returns: string
      }
    }
  }
}
