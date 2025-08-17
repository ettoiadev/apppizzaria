# Guia de Migração para Validação de APIs

## Visão Geral

Este guia demonstra como migrar endpoints existentes para usar o novo middleware de validação e segurança implementado.

## Middleware Disponível

### Componentes do Middleware

1. **Rate Limiting** - Controla número de requisições por IP
2. **Validação de Entrada** - Valida e sanitiza dados de entrada
3. **Autenticação** - Verifica tokens JWT de cookies seguros
4. **Logger de Segurança** - Registra atividades em endpoints sensíveis

### Exemplo de Uso Básico

```typescript
import { 
  withMiddleware, 
  rateLimit, 
  validateInput, 
  requireAuth, 
  securityLogger,
  type ValidationRule 
} from "@/lib/api-middleware"

// Definir regras de validação
const validationRules: ValidationRule[] = [
  { field: 'email', required: true, type: 'email', sanitize: true },
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100, sanitize: true }
]

export async function POST(request: NextRequest) {
  // Aplicar middlewares
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/endpoint'),
    validateInput(validationRules),
    requireAuth(['admin', 'user']) // Opcional: requer autenticação
  )(request)
  
  if (middlewareResult) {
    return middlewareResult
  }

  // Acessar dados sanitizados
  const sanitizedBody = (request as any).sanitizedBody
  const user = (request as any).user // Se autenticado
  
  // Lógica do endpoint...
}
```

## Exemplos de Migração

### 1. Endpoint de Pedidos (GET)

**Antes:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  // ... resto da lógica
}
```

**Depois:**
```typescript
export async function GET(request: NextRequest) {
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/orders')
  )(request)
  
  if (middlewareResult) return middlewareResult

  // Validação manual dos parâmetros
  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  
  if (status && !['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED'].includes(status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 })
  }
  
  // ... resto da lógica
}
```

### 2. Endpoint de Criação (POST)

**Antes:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  // Validação manual básica
  if (!body.name) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
  }
  // ... resto da lógica
}
```

**Depois:**
```typescript
const validationRules: ValidationRule[] = [
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100, sanitize: true },
  { field: 'email', required: true, type: 'email', sanitize: true },
  { field: 'phone', required: false, type: 'phone', sanitize: true }
]

export async function POST(request: NextRequest) {
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/endpoint'),
    validateInput(validationRules)
  )(request)
  
  if (middlewareResult) return middlewareResult

  const sanitizedBody = (request as any).sanitizedBody
  // Dados já validados e sanitizados
  // ... resto da lógica
}
```

### 3. Endpoint Protegido (Requer Autenticação)

**Antes:**
```typescript
export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
  }
  // Validação manual do token...
}
```

**Depois:**
```typescript
export async function POST(request: NextRequest) {
  const middlewareResult = await withMiddleware(
    securityLogger(),
    rateLimit('/api/admin/endpoint'),
    requireAuth(['admin']), // Apenas admins
    validateInput(validationRules)
  )(request)
  
  if (middlewareResult) return middlewareResult

  const user = (request as any).user // Dados do usuário autenticado
  const sanitizedBody = (request as any).sanitizedBody
  // ... resto da lógica
}
```

## Configurações de Rate Limiting

### Configurações Recomendadas por Tipo de Endpoint

```typescript
// Endpoints públicos (consulta)
rateLimit('/api/products', { windowMs: 15 * 60 * 1000, max: 100 })

// Endpoints de autenticação
rateLimit('/api/auth/login', { windowMs: 15 * 60 * 1000, max: 5 })
rateLimit('/api/auth/register', { windowMs: 15 * 60 * 1000, max: 3 })

// Endpoints administrativos
rateLimit('/api/admin/*', { windowMs: 15 * 60 * 1000, max: 50 })

// Endpoints de criação/modificação
rateLimit('/api/orders', { windowMs: 15 * 60 * 1000, max: 20 })
```

## Regras de Validação Disponíveis

### Tipos de Campo

- `string` - Texto geral
- `email` - Email válido
- `phone` - Telefone (formato brasileiro)
- `number` - Número
- `uuid` - UUID válido
- `url` - URL válida

### Opções de Validação

```typescript
interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'email' | 'phone' | 'number' | 'uuid' | 'url'
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  sanitize?: boolean
}
```

### Exemplos de Regras

```typescript
const rules: ValidationRule[] = [
  // Campo obrigatório com sanitização
  { field: 'name', required: true, type: 'string', minLength: 2, maxLength: 100, sanitize: true },
  
  // Email obrigatório
  { field: 'email', required: true, type: 'email', sanitize: true },
  
  // Telefone opcional
  { field: 'phone', required: false, type: 'phone', sanitize: true },
  
  // Número com limites
  { field: 'age', required: true, type: 'number', minLength: 18, maxLength: 120 },
  
  // Campo com padrão customizado
  { field: 'code', required: true, pattern: /^[A-Z]{3}\d{3}$/, sanitize: true },
  
  // UUID
  { field: 'user_id', required: true, type: 'uuid' }
]
```

## Endpoints Prioritários para Migração

### Alta Prioridade
1. `/api/auth/*` - Todos os endpoints de autenticação
2. `/api/orders` - Criação e listagem de pedidos
3. `/api/admin/*` - Endpoints administrativos

### Média Prioridade
1. `/api/products` - Gestão de produtos
2. `/api/users` - Gestão de usuários
3. `/api/drivers` - Gestão de entregadores

### Baixa Prioridade
1. `/api/reports` - Relatórios (já protegidos por auth)
2. `/api/settings` - Configurações

## Checklist de Migração

- [ ] Identificar endpoints existentes
- [ ] Definir regras de validação apropriadas
- [ ] Configurar rate limiting adequado
- [ ] Implementar middleware nos endpoints
- [ ] Testar validação de entrada
- [ ] Testar rate limiting
- [ ] Verificar logs de segurança
- [ ] Atualizar documentação da API

## Benefícios da Migração

1. **Segurança Aprimorada**
   - Validação consistente de entrada
   - Sanitização automática contra XSS
   - Rate limiting contra ataques de força bruta

2. **Código Mais Limpo**
   - Validação centralizada
   - Menos código repetitivo
   - Padrões consistentes

3. **Melhor Observabilidade**
   - Logs estruturados de segurança
   - Métricas de rate limiting
   - Rastreamento de tentativas maliciosas

4. **Manutenibilidade**
   - Regras de validação reutilizáveis
   - Configuração centralizada
   - Fácil atualização de políticas de segurança

## Próximos Passos

1. Implementar middleware nos endpoints de alta prioridade
2. Configurar monitoramento de logs de segurança
3. Estabelecer alertas para tentativas de ataque
4. Documentar APIs com novas validações
5. Treinar equipe sobre novos padrões de segurança