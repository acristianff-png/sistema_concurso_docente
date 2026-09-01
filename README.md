# Barema Tracker — AM Mentoria

Plataforma pessoal para acompanhar, em tempo real, a pontuação do barema de
títulos do concurso efetivo do Departamento de Medicina Preventiva e Social
(DMPS/UFMG), o plano de ação para fortalecer essa pontuação, e a qualificação
do currículo frente às três áreas temáticas prioritárias do edital.

Ferramenta de uso pessoal — não é um produto para terceiros. Todo dado fica
isolado por usuário via Row Level Security no Supabase.

## Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Estilo:** Tailwind CSS com os tokens de marca AM Mentoria
- **Backend/dados:** Supabase (Postgres + Auth + Client JS), sem servidor
  próprio — o client acessa o banco diretamente, protegido por RLS
- **Kanban:** @dnd-kit
- **Gráficos:** Recharts

## Estrutura do projeto

```
src/
  components/
    brand/       # StampCircle, TornEdgeBlock, NoticeBox, Badge, Button...
    barema/       # Quesitos, itens, fontes de pontuação
    kanban/       # Board, coluna, card, modal, filtros
    areas/        # Cards de área temática
    dashboard/    # Gráfico de evolução (dashboard)
    historico/    # Gráfico de timeline completo, snapshot de edital
    layout/       # AppLayout (nav), estado vazio
  hooks/          # useAuth, useEdital, useBarema, useAcoes, useAreas,
                  # useHistorico, useToast, useSimulacao
  lib/
    supabase.ts   # client do Supabase
  pages/          # Dashboard, Barema, Ações, Áreas, Histórico, Login
  types/          # database.ts (tipos gerados à mão do schema),
                  # domain.ts (tipos compostos + cálculos de totais)
  utils/          # urgencia.ts, forcaArea.ts, exportMemorial.ts, cn.ts
supabase/
  migrations/     # schema, trigger de histórico, seed, snapshot de edital
```

Tokens de design centralizados em `tailwind.config.ts` (paleta, fontes) e
`src/styles/tokens.css` (as mesmas cores como CSS custom properties, para uso
fora de classes Tailwind).

## 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → API**, anote a **Project URL** e a **anon public
   key** — vão para o `.env` (passo 3).
3. Em **Project Settings → Authentication → Providers**, deixe **Email**
   habilitado. Como é uso pessoal (um único usuário), você pode desativar a
   confirmação por e-mail em **Authentication → Sign In / Providers → Email**
   se quiser entrar direto, ou usar o magic link (padrão, sem senha).
4. Crie o seu usuário: **Authentication → Users → Add user** (defina e-mail e
   senha), ou simplesmente use "Enviar link mágico" na tela de login do app
   depois de configurado — o Supabase cria o usuário no primeiro acesso.

## 2. Rodar as migrations

No **SQL Editor** do painel do Supabase, rode os arquivos de
`supabase/migrations/` **em ordem** (o nome já garante a ordem correta):

1. `20260807120001_schema.sql` — tabelas, RLS, triggers de `updated_at`
2. `20260807120002_historico_trigger.sql` — trigger que popula
   `historico_pontuacao` automaticamente a cada mudança de fonte de pontuação
3. `20260807120003_seed_function.sql` — define a função `seed_dados_iniciais()`
   (não popula nada sozinha — veja o passo 4)
4. `20260807120004_duplicar_edital.sql` — define a função
   `duplicar_edital_para_novo()`, usada pelo botão "Duplicar estrutura para
   novo edital" na página de Histórico
5. `20260807130001_calculo_automatico.sql` — histórico: introduziu (e depois a
   migration 7 removeu) o cálculo automático de pontuação por carga horária ou
   por período
6. `20260807130002_seed_dados_reais.sql` — substitui `seed_dados_iniciais()`
   pelos valores oficiais do edital e pelas experiências reais do currículo
   (ver nota abaixo se você já rodou o seed antigo)
7. `20260807130003_pontuacao_manual.sql` — remove o cálculo automático: a
   pontuação de toda fonte passa a ser sempre digitada manualmente (ver
   [Pontuação manual](#pontuação-manual) abaixo)
8. `20260807140001_criterio_edital.sql` — adiciona a descrição do critério
   de pontuação de cada item (texto do edital), preenchida automaticamente
   por um trigger — não precisa reseedar para os itens já existentes, essa
   migration já faz o backfill sozinha

Alternativamente, se preferir usar o [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase db push
```

### Populando os dados iniciais

As migrations **não** inserem dados — elas só criam a função
`seed_dados_iniciais()`, que grava os dados no nome do usuário autenticado que
a chama (assim nenhuma migration precisa hardcodar um `user_id`). Depois de
logar no app pela primeira vez, a tela inicial mostra um botão **"Carregar
dados iniciais"** que chama essa função uma única vez e popula o Edital
3.244/2025 com os quesitos, itens e ações de partida.

**Se você já rodou o seed antes** (versão com valores estimados) e agora vai
rodar a migration `20260807130002` com os dados reais: apague o edital antigo
primeiro, senão a função vê que já existe um edital com esse nome e não faz
nada. No SQL Editor:

```sql
delete from editais where nome = 'Edital 3.244/2025';
```

(isso apaga em cascata quesitos, itens, fontes, áreas e ações vinculados a
esse edital — o histórico de pontuação de outros editais não é afetado).
Depois, clique de novo em "Carregar dados iniciais" no app.

### Pontuação manual

Toda fonte de pontuação tem seu valor **digitado manualmente** por quem usa o
app — o sistema não calcula nada sozinho, nem de forma proporcional (ex.: um
item "1 ponto a cada 6 meses" não gera 0.5 ponto para 3 meses; ou atende o
bloco inteiro, ou não pontua).

Cada item mostra o critério de pontuação do edital (`criterio_edital` —
migration `20260807140001`) como subtítulo no `ItemRow`, e por extenso ao
expandir — isso só lembra a regra enquanto você decide quantos pontos aquela
fonte vale; não influencia o valor salvo. O badge "carga horária"/"período"
e o texto "Regra do edital: X pt a cada Yh" que existiam antes no formulário
foram removidos (o `criterio_edital` cobre a mesma necessidade, com o texto
literal do edital em vez de uma fórmula).

Antes da migration `20260807130003_pontuacao_manual.sql`, havia um cálculo
automático no banco (trigger `calcular_valor_fonte`, migration
`20260807130001`) por carga horária ou por período. Foi removido a pedido:
além de nunca fracionar pontos, o controle final é sempre do usuário.

## 3. Variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

```
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key-publica
```

## 4. Rodar localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:5173`, faça login (e-mail/senha ou link mágico) e
clique em "Carregar dados iniciais" na primeira tela.

## 5. Build de produção

```bash
npm run build   # gera dist/
npm run preview # serve o build localmente para conferir
```

## 6. Deploy

### Vercel

1. Importe o repositório no Vercel.
2. Framework preset: **Vite**.
3. Em **Environment Variables**, adicione `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
4. O `vercel.json` já está configurado para reescrever todas as rotas para
   `index.html` (necessário para o React Router funcionar em URLs diretas
   como `/barema`).

### Netlify

1. Importe o repositório no Netlify.
2. Build command: `npm run build` — Publish directory: `dist` (já
   configurado em `netlify.toml`, que também cuida do redirect de rotas).
3. Adicione as mesmas variáveis de ambiente em **Site settings →
   Environment variables**.

### GitHub Pages

Diferente de Vercel/Netlify, o GitHub Pages só serve arquivos estáticos, sem
rewrite de rotas nem variáveis de ambiente em runtime — por isso o projeto já
vem com os ajustes necessários: `vite.config.ts` define `base:
'/sistema_concurso_docente/'` só no build de produção, `public/404.html` +
o script no `<head>` do `index.html` simulam o rewrite de rotas (truque
padrão de SPA no GitHub Pages), e o `BrowserRouter` usa
`basename={import.meta.env.BASE_URL}` para casar com esse subcaminho.

1. **Gerar as credenciais como Secrets do repositório** (o build roda no
   GitHub, não na sua máquina, então as variáveis de ambiente precisam estar
   lá): no repositório, vá em **Settings → Secrets and variables → Actions
   → New repository secret** e crie:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY` (a *publishable key*, que é segura para
     expor publicamente — mas usar Secret aqui evita deixá-la hardcoded no
     workflow)
2. **Habilitar o Pages com origem "GitHub Actions"**: **Settings → Pages →
   Build and deployment → Source → GitHub Actions**.
3. **Dar um push** na branch configurada no workflow
   (`.github/workflows/deploy-gh-pages.yml` — por padrão
   `claude/barema-tracking-platform-crtmna`; troque para `main` quando
   mesclar). O Actions builda e publica automaticamente. Também dá pra
   disparar manualmente em **Actions → Deploy no GitHub Pages → Run
   workflow**.
4. O site fica em `https://SEU-USUARIO.github.io/sistema_concurso_docente/`.

Se o repositório tiver outro nome (não `sistema_concurso_docente`), ajuste o
valor de `base` em `vite.config.ts`, o `pathSegmentsToKeep` em
`public/404.html` e a URL final acima.

## Modelo de dados

Ver `supabase/migrations/20260807120001_schema.sql` para o schema completo.
Resumo das tabelas principais:

- `editais` — snapshot versionado do barema (permite trocar de edital sem
  perder histórico)
- `quesitos` — os 5 quesitos do barema, numerados
- `itens_barema` — itens dentro de cada quesito
- `fontes_pontuacao` — evidências que compõem o valor de um item (1 item
  pode ter N fontes); `confirmado = false` marca uma fonte como projeção
- `areas_tematicas`, `area_elementos`, `area_sugestoes` — qualificação do
  currículo por área temática
- `acoes`, `acao_comentarios` — kanban do plano de ação
- `historico_pontuacao` — populada automaticamente por trigger a cada
  alteração de fonte de pontuação, alimenta os gráficos de evolução

Todas as tabelas têm RLS restringindo as linhas ao usuário autenticado
(`auth.uid()`), direto ou por herança via as FKs até `editais`/`acoes`.

## Funcionalidades

- **Dashboard** — pontuação total e por quesito, aviso de "quesito no teto",
  gráfico de evolução
- **Barema** — quesitos numerados e conectados por uma linha tracejada,
  itens expansíveis com suas fontes de pontuação; cada item mostra o
  critério de pontuação do edital (quanto vale, por quê) sem precisar abrir
  o PDF, e itens por carga horária/período calculam o valor automaticamente
- **Modo simulação** — toggle global que soma também fontes não confirmadas
  (projeção), sempre visualmente distinto do valor confirmado
- **Plano de ação (kanban)** — 3 colunas com drag-and-drop, badges de
  quesito/área/prioridade/urgência, comentários datados, filtros
- **Áreas temáticas** — elementos existentes, sugestões (aceitar → vira ação
  automaticamente), pontuação de força 0–100 (fórmula documentada em
  `src/utils/forcaArea.ts`)
- **Histórico** — timeline completa por quesito, exportação do memorial em
  Markdown, duplicação de estrutura para um novo edital

## Licença

Uso pessoal.
