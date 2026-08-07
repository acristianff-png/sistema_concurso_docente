-- ============================================================================
-- Trigger: recalcula e registra o histórico de pontuação por quesito sempre
-- que uma fonte_pontuacao é inserida, alterada ou removida.
--
-- Pontuação de um item = soma das fontes CONFIRMADAS, limitada ao teto do
-- item (pontuacao_maxima). Fontes com confirmado = false são "projeção" e
-- não entram no histórico oficial — apenas no modo simulação da UI.
--
-- Pontuação de um quesito = soma da pontuação de seus itens, limitada ao
-- teto do quesito.
--
-- security definer: a função escreve em historico_pontuacao (tabela
-- somente-leitura para o client) em nome do dono do registro.
-- ============================================================================
create or replace function public.registrar_historico_pontuacao(p_quesito_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_edital_id uuid;
  v_user_id uuid;
  v_teto numeric(10, 2);
  v_pontuacao numeric(10, 2);
begin
  select q.edital_id, q.teto, e.user_id
    into v_edital_id, v_teto, v_user_id
    from public.quesitos q
    join public.editais e on e.id = q.edital_id
    where q.id = p_quesito_id;

  if v_edital_id is null then
    return;
  end if;

  select coalesce(sum(item_total), 0)
    into v_pontuacao
    from (
      select least(coalesce(sum(f.valor), 0), i.pontuacao_maxima) as item_total
      from public.itens_barema i
      left join public.fontes_pontuacao f
        on f.item_id = i.id and f.confirmado = true
      where i.quesito_id = p_quesito_id
      group by i.id, i.pontuacao_maxima
    ) items;

  v_pontuacao := least(v_pontuacao, v_teto);

  insert into public.historico_pontuacao (user_id, edital_id, quesito_id, pontuacao)
  values (v_user_id, v_edital_id, p_quesito_id, v_pontuacao);
end;
$$;

create or replace function public.trg_fontes_pontuacao_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_quesito_id uuid;
begin
  select i.quesito_id into v_quesito_id
    from public.itens_barema i
    where i.id = coalesce(new.item_id, old.item_id);

  perform public.registrar_historico_pontuacao(v_quesito_id);

  return coalesce(new, old);
end;
$$;

create trigger fontes_pontuacao_historico
  after insert or update or delete on public.fontes_pontuacao
  for each row execute function public.trg_fontes_pontuacao_historico();

-- Também registra histórico quando o teto do quesito ou o teto/unidade de
-- um item mudam (afeta o valor efetivo sem alterar fontes_pontuacao).
create or replace function public.trg_quesitos_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.registrar_historico_pontuacao(new.id);
  return new;
end;
$$;

create trigger quesitos_historico
  after update of teto on public.quesitos
  for each row execute function public.trg_quesitos_historico();

create or replace function public.trg_itens_barema_historico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.registrar_historico_pontuacao(new.quesito_id);
  return new;
end;
$$;

create trigger itens_barema_historico
  after update of pontuacao_maxima on public.itens_barema
  for each row execute function public.trg_itens_barema_historico();
