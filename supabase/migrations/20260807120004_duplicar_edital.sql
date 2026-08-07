-- ============================================================================
-- Snapshot de edital: duplica a estrutura de quesitos/itens de um edital
-- existente para um novo edital, zerando as fontes de pontuação (o novo
-- ciclo começa do zero), sem tocar no edital de origem — preservando seu
-- histórico em historico_pontuacao.
--
-- Áreas temáticas não são duplicadas automaticamente (o texto do edital
-- pode redefinir as áreas prioritárias); recriar manualmente pela UI caso
-- o novo edital repita as mesmas áreas.
-- ============================================================================
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

  -- Apenas um edital "ativo" por vez (é ele que o dashboard exibe) — o
  -- de origem passa a inativo, mas seu histórico continua intacto.
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
      select * from public.itens_barema where quesito_id = v_quesito.id
    loop
      -- fontes_pontuacao não são copiadas: o novo edital começa zerado.
      insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima)
      values (v_novo_quesito_id, v_item.nome, v_item.unidade, v_item.pontuacao_maxima);
    end loop;
  end loop;

  return v_novo_edital_id;
end;
$$;

grant execute on function public.duplicar_edital_para_novo(uuid, text, date) to authenticated;
