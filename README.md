# Biscoitê — Controle de Reclamações (MVP)

Sistema interno de registro e acompanhamento de reclamações, com busca automática
de pedidos no BigQuery (Nexaas) e board Kanban para acompanhamento de status.

Stack: Next.js (App Router) + Prisma + Vercel Postgres + BigQuery + dnd-kit.

---

## 1. Pré-requisitos

- [Node.js 20+](https://nodejs.org/) instalado
- [VSCode](https://code.visualstudio.com/) (ou outro editor)
- Conta na Vercel (você já tem, plano Hobby/padrão)
- Service account do Google Cloud com permissão de leitura no BigQuery (você já tem)

---

## 2. Rodando o projeto localmente pela primeira vez

### 2.1. Instalar dependências

Abra a pasta do projeto no VSCode, abra o terminal integrado (`Ctrl+\``) e rode:

```bash
npm install
```

### 2.2. Criar o banco Postgres na Vercel

1. Acesse [vercel.com/dashboard](https://vercel.com/dashboard)
2. Se o projeto ainda não existe na Vercel, crie um novo projeto (pode importar
   este código de um repositório Git, ou criar vazio e fazer deploy depois — veja
   seção 4)
3. Dentro do projeto na Vercel, vá na aba **Storage**
4. Clique em **Create Database** → escolha **Postgres** (Neon)
5. Dê um nome ao banco (ex: `biscoite-reclamacoes-db`) e confirme a criação
6. A Vercel conecta o banco automaticamente ao projeto e cria as variáveis de
   ambiente `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING`
7. Ainda na aba Storage, clique em **.env.local** (ou "Show secret" / "Copiar
   variáveis") para copiar essas duas variáveis

### 2.3. Configurar as variáveis de ambiente localmente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha:

- `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` — cole os valores copiados
  no passo 2.2
- `APP_USERNAME` e `APP_PASSWORD` — defina o usuário/senha que você vai usar
  para logar no sistema
- `SESSION_SECRET` — gere um valor aleatório longo. No terminal:
  ```bash
  openssl rand -hex 32
  ```
  (no Windows sem `openssl`, pode gerar em https://generate-secret.vercel.app/32)
- `GOOGLE_CREDENTIALS_BASE64` — veja o passo 2.4 abaixo
- `BIGQUERY_TABLE` — já vem preenchido com
  `igneous-ethos-444918-p4.BISCOITE.biscoite_bronze` (ajuste se mudar)

### 2.4. Preparar a credencial do BigQuery

Você precisa do arquivo JSON da service account (a mesma que já tem permissão
de leitura no BigQuery). Converta para base64 em uma linha só:

**Mac/Linux:**
```bash
base64 -i caminho/para/sua-chave.json | tr -d '\n' > chave-base64.txt
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("caminho\para\sua-chave.json")) | Out-File chave-base64.txt
```

Abra o arquivo `chave-base64.txt`, copie todo o conteúdo (é uma linha só, bem
longa) e cole em `GOOGLE_CREDENTIALS_BASE64` no `.env.local`. Depois pode
apagar o `chave-base64.txt` — não deixe esse arquivo no repositório.

### 2.5. Criar as tabelas no banco (Prisma)

Com o `.env.local` preenchido, rode:

```bash
npx prisma migrate dev --name init
```

Isso cria as tabelas `Reclamacao`, `HistoricoStatus` e `Loja` no banco Postgres
da Vercel, seguindo o schema em `prisma/schema.prisma`.

(Opcional, mas recomendado) Popule a tabela de lojas com os contatos que já
existiam na planilha:

```bash
npx prisma db seed
```

### 2.6. Rodar o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) — você vai cair na tela
de login. Use o `APP_USERNAME`/`APP_PASSWORD` que você definiu no `.env.local`.

---

## 3. Testando o fluxo

1. Faça login
2. Vá em **Nova reclamação**
3. Busque um pedido por número, telefone ou CPF (usa o BigQuery)
4. Se encontrado, os dados do cliente/pedido preenchem automaticamente
5. Complete motivo, submotivo e descrição, e registre
6. Vá para o **Board** — o card aparece na coluna "Aberto"
7. Arraste o card entre colunas para mudar o status
8. Clique em "Ver detalhes" para conferir o histórico de status

Se a busca no BigQuery não encontrar nada (ou der erro), o sistema permite
cadastrar os dados manualmente — isso é esperado para pedidos de marketplaces
como Shopee/Mercado Livre/House of Gamers, conforme conversamos.

---

## 4. Publicando na Vercel

Se o projeto ainda não está conectado a um repositório Git:

```bash
git init
git add .
git commit -m "MVP inicial - Biscoitê Controle de Reclamações"
```

Suba para o GitHub (crie um repositório vazio lá primeiro) e depois:

```bash
git remote add origin <url-do-seu-repositorio>
git push -u origin main
```

Na Vercel:

1. **Add New Project** → importe o repositório do GitHub
2. Como o banco Postgres já foi criado no passo 2.2 dentro deste mesmo projeto
   Vercel, as variáveis `POSTGRES_PRISMA_URL` e `POSTGRES_URL_NON_POOLING` já
   estarão disponíveis automaticamente
3. Adicione manualmente as demais variáveis de ambiente em **Settings → Environment
   Variables** (mesmas do seu `.env.local`): `APP_USERNAME`, `APP_PASSWORD`,
   `SESSION_SECRET`, `GOOGLE_CREDENTIALS_BASE64`, `BIGQUERY_TABLE`, `BIGQUERY_LOCATION`
4. Clique em **Deploy**

Depois do primeiro deploy, se precisar rodar as migrations no banco de produção
(caso ainda não tenha rodado localmente apontando pro mesmo banco), rode
localmente com o `.env.local` apontando para as credenciais de produção:

```bash
npx prisma migrate deploy
```

---

## 5. Estrutura do projeto

```
src/
  app/
    login/                  → tela de login
    board/                  → board Kanban (tela principal)
    nova-reclamacao/        → formulário de registro
    reclamacao/[id]/        → detalhe e histórico
    api/
      auth/                 → login/logout
      pedidos/buscar/       → busca no BigQuery
      reclamacoes/          → CRUD de reclamações + atualização de status
  components/               → componentes de UI (Board, formulário, busca)
  lib/
    prisma.ts               → cliente Prisma
    bigquery.ts             → busca de pedidos no BigQuery
    session.ts              → assinatura de sessão (compatível com Edge)
    auth.ts                 → helpers de autenticação para Server Components
    taxonomy.ts             → motivos, submotivos, canais, status
    validation.ts           → validação (zod) do formulário
  middleware.ts             → protege rotas exigindo login
prisma/
  schema.prisma             → modelo do banco
  seed.ts                   → popula tabela de lojas com contatos existentes
```

---

## 6. O que ainda não está no MVP (por decisão de escopo)

- Busca automática por pedidos de marketplaces com `external_code` não-exato
  (Shopee, Mercado Livre, Itaú, House of Gamers) — fica manual por enquanto
- Múltiplos usuários/login (hoje é usuário único)
- Notificações automáticas ao cliente
- Conexão direta com Power BI (a base já fica pronta para isso — é só apontar
  o conector Postgres do Power BI Premium para o mesmo banco)

## 7. Se algo não funcionar

- **Erro de conexão com o banco**: confira se `POSTGRES_PRISMA_URL` e
  `POSTGRES_URL_NON_POOLING` estão corretos no `.env.local`
- **Busca de pedido sempre falha**: confira se `GOOGLE_CREDENTIALS_BASE64` foi
  colado corretamente (sem quebras de linha) e se a service account tem
  permissão de leitura no dataset `BISCOITE`
- **Não consigo logar**: confira `APP_USERNAME`/`APP_PASSWORD` no `.env.local`
  e reinicie o `npm run dev` depois de qualquer mudança nesse arquivo
