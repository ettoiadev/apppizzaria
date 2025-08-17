# Configuração de Segurança do Supabase Auth

## Configurações que devem ser aplicadas via Dashboard do Supabase

Essas configurações não podem ser aplicadas via SQL e devem ser configuradas manualmente no Dashboard do Supabase:

### 1. Proteção contra Senhas Vazadas

**Localização:** Dashboard > Authentication > Settings > Security

**Configurações:**
- ✅ **Enable breach protection**: Ativar
- ✅ **Minimum password length**: 8 caracteres
- ✅ **Require uppercase letters**: Ativar
- ✅ **Require lowercase letters**: Ativar
- ✅ **Require numbers**: Ativar
- ✅ **Require special characters**: Ativar

### 2. Configurações de Sessão

**Localização:** Dashboard > Authentication > Settings > Sessions

**Configurações:**
- **JWT expiry**: 3600 segundos (1 hora)
- **Refresh token expiry**: 2592000 segundos (30 dias)
- **Enable automatic reuse detection**: Ativar

### 3. Configurações de Rate Limiting

**Localização:** Dashboard > Authentication > Settings > Rate Limiting

**Configurações:**
- **Email rate limit**: 3 emails por hora
- **SMS rate limit**: 3 SMS por hora
- **Password reset rate limit**: 5 tentativas por hora

### 4. Configurações de Email

**Localização:** Dashboard > Authentication > Settings > Email Templates

**Configurações:**
- Personalizar templates de email para incluir informações de segurança
- Ativar confirmação de email obrigatória
- Configurar redirecionamento seguro após confirmação

### 5. Configurações de Providers

**Localização:** Dashboard > Authentication > Providers

**Configurações:**
- Desabilitar providers não utilizados
- Configurar redirect URLs apenas para domínios confiáveis
- Ativar PKCE para OAuth flows

## Verificação das Configurações

Após aplicar essas configurações, você pode verificar se estão ativas:

```sql
-- Verificar configurações de autenticação
SELECT * FROM auth.config;

-- Verificar políticas de senha (se disponível)
SELECT * FROM auth.password_policy;
```

## Implementação no Código

As melhorias de segurança já foram implementadas no código:

1. **Contexto de autenticação seguro** (`contexts/secure-auth-context.tsx`)
2. **Utilitários de segurança** (`lib/auth-security.ts`)
3. **Endpoints seguros** (`app/api/auth/secure-login/route.ts`, `app/api/auth/me/route.ts`, `app/api/auth/logout/route.ts`)
4. **Validação de senhas** (força, senhas comuns, etc.)
5. **Rate limiting** básico implementado
6. **Cookies httpOnly** em vez de localStorage

## Próximos Passos

1. Aplicar as configurações manuais no Dashboard do Supabase
2. Testar o novo sistema de autenticação
3. Migrar componentes existentes para usar o novo contexto seguro
4. Implementar monitoramento de tentativas de login suspeitas
5. Configurar alertas para atividades de segurança