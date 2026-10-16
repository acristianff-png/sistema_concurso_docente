-- ============================================================================
-- Ordem manual dos itens dentro de cada quesito — para o usuário poder
-- deixar a lista na sequência exata do documento oficial do edital, em vez
-- de ficar na ordem de criação/edição.
-- ============================================================================
alter table public.itens_barema add column ordem int not null default 0;

-- Backfill: numera os itens já existentes pela ordem de criação atual
-- (dentro de cada quesito), que é a melhor aproximação disponível da
-- sequência original até o usuário reordenar manualmente.
update public.itens_barema ib
set ordem = sub.rn
from (
  select id, row_number() over (partition by quesito_id order by created_at) as rn
  from public.itens_barema
) sub
where sub.id = ib.id;

-- Duplicar edital passa a preservar a ordem dos itens copiados.
create or replace function public.duplicar_edital_para_novo(
  p_edital_origem_id uuid,
  p_novo_nome text,
  p_data_publicacao date default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_novo_edital_id uuid;
  v_quesito record;
  v_novo_quesito_id uuid;
  v_item record;
begin
  if v_user_id is null then
    raise exception 'duplicar_edital_para_novo: usuário não autenticado';
  end if;

  if not exists (
    select 1 from public.editais
    where id = p_edital_origem_id and user_id = v_user_id
  ) then
    raise exception 'duplicar_edital_para_novo: edital de origem não encontrado';
  end if;

  update public.editais set ativo = false where id = p_edital_origem_id;

  insert into public.editais (user_id, nome, ativo, data_publicacao)
  values (v_user_id, p_novo_nome, true, p_data_publicacao)
  returning id into v_novo_edital_id;

  for v_quesito in
    select * from public.quesitos where edital_id = p_edital_origem_id order by ordem
  loop
    insert into public.quesitos (edital_id, ordem, nome, teto)
    values (v_novo_edital_id, v_quesito.ordem, v_quesito.nome, v_quesito.teto)
    returning id into v_novo_quesito_id;

    for v_item in
      select * from public.itens_barema where quesito_id = v_quesito.id order by ordem
    loop
      insert into public.itens_barema (
        quesito_id, nome, unidade, pontuacao_maxima, ordem,
        modo_calculo, horas_por_unidade, pontos_por_unidade, unidade_periodo
      )
      values (
        v_novo_quesito_id, v_item.nome, v_item.unidade, v_item.pontuacao_maxima, v_item.ordem,
        v_item.modo_calculo, v_item.horas_por_unidade, v_item.pontos_por_unidade, v_item.unidade_periodo
      );
    end loop;
  end loop;

  return v_novo_edital_id;
end;
$$;
