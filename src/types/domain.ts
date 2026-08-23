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

/** Soma das fontes de um item, sem respeitar o teto — usada só para calcular a margem. */
function totalItemBruto(item: ItemComFontes, incluirProjetadas: boolean): number {
  return item.fontes_pontuacao
    .filter((f) => incluirProjetadas || f.confirmado)
    .reduce((acc, f) => acc + f.valor, 0)
}

/** Soma das fontes de um item, respeitando o teto do item. */
export function totalItem(item: ItemComFontes, incluirProjetadas: boolean): number {
  return Math.min(totalItemBruto(item, incluirProjetadas), item.pontuacao_maxima)
}

/**
 * Quanto o item já ultrapassa o próprio teto (0 se ainda não bateu o teto).
 * É a folga: pontos que já pontuam no item e podem ser perdidos (fonte não
 * aceita, projeção que não se confirma) sem derrubar a nota do item.
 */
export function margemItem(item: ItemComFontes, incluirProjetadas: boolean): number {
  return Math.max(0, totalItemBruto(item, incluirProjetadas) - item.pontuacao_maxima)
}

/** Soma dos itens de um quesito, sem respeitar o teto do quesito — usada só para calcular a margem. */
function totalQuesitoBruto(quesito: QuesitoComItens, incluirProjetadas: boolean): number {
  return quesito.itens_barema.reduce((acc, item) => acc + totalItem(item, incluirProjetadas), 0)
}

/** Soma dos itens de um quesito, respeitando o teto do quesito. */
export function totalQuesito(quesito: QuesitoComItens, incluirProjetadas: boolean): number {
  return Math.min(totalQuesitoBruto(quesito, incluirProjetadas), quesito.teto)
}

/**
 * Quanto o quesito já ultrapassa o próprio teto (0 se ainda não bateu o
 * teto) — soma dos itens já no próprio teto individual, então é a folga
 * "entre itens": quantos pontos confirmados no quesito podem se perder
 * (algo não aceito) sem derrubar a nota do quesito.
 */
export function margemQuesito(quesito: QuesitoComItens, incluirProjetadas: boolean): number {
  return Math.max(0, totalQuesitoBruto(quesito, incluirProjetadas) - quesito.teto)
}
