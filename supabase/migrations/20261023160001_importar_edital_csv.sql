-- ============================================================================
-- Importa um edital inteiro (quesitos + itens que pontuam) a partir do CSV
-- que o usuário exporta do edital oficial, numa chamada só e transacional
-- (se qualquer item falhar, nada é criado).
-- ============================================================================
create or replace function public.importar_edital_csv(
  p_nome text,
  p_data_publicacao date,
  p_quesitos jsonb
  -- p_quesitos: [{ nome text, teto numeric, itens: [{ nome text, unidade numeric, pontuacao_maxima numeric, criterio_edital text|null }] }]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_edital_id uuid;
  v_quesito jsonb;
  v_item jsonb;
  v_quesito_id uuid;
  v_ordem_quesito int := 0;
  v_ordem_item int;
begin
  if v_user_id is null then
    raise exception 'importar_edital_csv: usuário não autenticado';
  end if;

  if p_quesitos is null or jsonb_array_length(p_quesitos) = 0 then
    raise exception 'importar_edital_csv: nenhum quesito informado';
  end if;

  insert into public.editais (user_id, nome, ativo, data_publicacao)
  values (v_user_id, p_nome, false, p_data_publicacao)
  returning id into v_edital_id;

  for v_quesito in select * from jsonb_array_elements(p_quesitos)
  loop
    v_ordem_quesito := v_ordem_quesito + 1;

    insert into public.quesitos (edital_id, ordem, nome, teto)
    values (
      v_edital_id,
      v_ordem_quesito,
      v_quesito->>'nome',
      (v_quesito->>'teto')::numeric
    )
    returning id into v_quesito_id;

    v_ordem_item := 0;
    for v_item in select * from jsonb_array_elements(v_quesito->'itens')
    loop
      v_ordem_item := v_ordem_item + 1;

      insert into public.itens_barema (quesito_id, nome, unidade, pontuacao_maxima, ordem, criterio_edital)
      values (
        v_quesito_id,
        v_item->>'nome',
        (v_item->>'unidade')::numeric,
        (v_item->>'pontuacao_maxima')::numeric,
        v_ordem_item,
        v_item->>'criterio_edital'
      );
    end loop;
  end loop;

  return v_edital_id;
end;
$$;

grant execute on function public.importar_edital_csv(text, date, jsonb) to authenticated;
