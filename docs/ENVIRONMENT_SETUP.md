# Configuração de Ambiente - William Disk Pizza

Este documento fornece instruções detalhadas para configurar o ambiente de desenvolvimento e produção da aplicação William Disk Pizza.

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Docker (para Supabase local)
- Git

## 🚀 Configuração para Desenvolvimento Local

### 1. Clone o Repositório

```bash
git clone <repository-url>
cd williamdiskpizza
npm install
```

### 2. Configure o Supabase Local

```bash
# Instale a CLI do Supabase (se não tiver)
npm install -g @supabase/cli

# Inicie o Supabase local
supabase start

# Verifique o status e obtenha as URLs/chaves
supabase status
```

### 3. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com os valores obtidos do `supabase status`:

```env
# Exemplo de saída do 'supabase status':
# API URL: http://localhost:54321
# anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-aqui
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui
```

### 4. Execute as Migrações

```bash
# Aplicar migrações do banco
supabase db reset

# Ou aplicar apenas as novas migrações
supabase db push
```

### 5. Inicie a Aplicação

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

## 🌐 Configuração para Produção

### 1. Crie um Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização/projeto
3. Anote a URL e as chaves do projeto

### 2. Configure as Variáveis de Ambiente de Produção

```env
# Supabase Produção
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-producao
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-producao

# JWT Secrets (GERE CHAVES ÚNICAS E SEGURAS!)
JWT_SECRET=sua-chave-jwt-super-secreta-com-pelo-menos-32-caracteres
JWT_REFRESH_SECRET=sua-chave-refresh-super-secreta-com-pelo-menos-32-caracteres

# Ambiente
NODE_ENV=production

# Segurança
SECURE_COOKIES=true
COOKIE_DOMAIN=seudominio.com
```

### 3. Deploy das Migrações

```bash
# Conecte ao projeto de produção
supabase link --project-ref seu-project-ref

# Aplique as migrações
supabase db push
```

## 🔐 Variáveis de Ambiente Detalhadas

### Supabase

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL pública do Supabase | ✅ | `http://localhost:54321` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (frontend) | ✅ | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de service role (backend) | ✅ | `eyJhbGciOiJIUzI1NiIs...` |

### Autenticação

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|----------|
| `JWT_SECRET` | Chave para tokens de acesso | ✅ | `minha-chave-super-secreta-32-chars` |
| `JWT_REFRESH_SECRET` | Chave para tokens de refresh | ✅ | `minha-chave-refresh-secreta-32-chars` |

### Aplicação

| Variável | Descrição | Obrigatória | Exemplo |
|----------|-----------|-------------|----------|
| `NODE_ENV` | Ambiente de execução | ✅ | `development` ou `production` |
| `NEXTAUTH_URL` | URL base da aplicação | ✅ | `http://localhost:3000` |

### Logs e Debug

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `ENABLE_QUERY_LOGS` | Habilitar logs de SQL | ❌ | `true` |
| `ENABLE_SLOW_QUERY_LOGS` | Logs de queries lentas | ❌ | `true` |
| `SLOW_QUERY_THRESHOLD` | Limite para query lenta (ms) | ❌ | `1000` |

### Segurança

| Variável | Descrição | Obrigatória | Padrão |
|----------|-----------|-------------|--------|
| `SECURE_COOKIES` | Cookies seguros (HTTPS) | ❌ | `false` |
| `COOKIE_DOMAIN` | Domínio dos cookies | ❌ | `` |
| `ENABLE_RATE_LIMITING` | Habilitar rate limiting | ❌ | `true` |
| `RATE_LIMIT_WINDOW` | Janela de rate limit (ms) | ❌ | `60000` |
| `RATE_LIMIT_MAX` | Max requests por janela | ❌ | `60` |

## 🛠️ Comandos Úteis

### Supabase

```bash
# Ver status do Supabase local
supabase status

# Parar Supabase local
supabase stop

# Reset completo do banco
supabase db reset

# Gerar tipos TypeScript
supabase gen types typescript --local > types/supabase.ts

# Ver logs em tempo real
supabase logs
```

### Desenvolvimento

```bash
# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build de produção
npm start

# Executar testes
npm test

# Lint do código
npm run lint
```

## 🔍 Troubleshooting

### Problema: "Invalid API key"

**Solução:** Verifique se as chaves do Supabase estão corretas no arquivo `.env`

```bash
supabase status
# Copie as chaves corretas para o .env
```

### Problema: "Connection refused"

**Solução:** Certifique-se de que o Supabase está rodando

```bash
supabase start
```

### Problema: "JWT malformed"

**Solução:** Verifique se o `JWT_SECRET` está configurado corretamente

### Problema: Migrações não aplicadas

**Solução:** Execute o reset do banco

```bash
supabase db reset
```

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

## 🆘 Suporte

Se encontrar problemas:

1. Verifique se todas as variáveis obrigatórias estão configuradas
2. Confirme se o Supabase está rodando (`supabase status`)
3. Verifique os logs da aplicação e do Supabase
4. Consulte a documentação oficial

---

**⚠️ IMPORTANTE:** Nunca commite o arquivo `.env` com valores reais. Sempre use o `.env.example` como referência.