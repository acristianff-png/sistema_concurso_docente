import type {
  AcaoComentario,
  AreaElemento,
  AreaSugestao,
  Acao,
  AreaTematica,
  FontePontuacao,
  ItemBarema,
  Quesito,
} from './database'

export interface ItemComFontes extends ItemBarema {
  fontes_pontuacao: FontePontuacao[]
}

export interface QuesitoComItens extends Quesito {
  itens_barema: ItemComFontes[]
}

export interface AreaComDetalhes extends AreaTematica {
  area_elementos: AreaElemento[]
  area_sugestoes: AreaSugestao[]
}

export interface AcaoComComentarios extends Acao {
  acao_comentarios: AcaoComentario[]
}

/** Soma das fontes de um item, respeitando o teto do item. */
export function totalItem(item: ItemComFontes, incluirProjetadas: boolean): number {
  const total = item.fontes_pontuacao
    .filter((f) => incluirProjetadas || f.confirmado)
    .reduce((acc, f) => acc + f.valor, 0)
  return Math.min(total, item.pontuacao_maxima)
}

/** Soma dos itens de um quesito, respeitando o teto do quesito. */
export function totalQuesito(quesito: QuesitoComItens, incluirProjetadas: boolean): number {
  const total = quesito.itens_barema.reduce((acc, item) => acc + totalItem(item, incluirProjetadas), 0)
  return Math.min(total, quesito.teto)
}
