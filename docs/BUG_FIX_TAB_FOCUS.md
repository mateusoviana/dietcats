# 🐛 Bug Fix: Timeout ao voltar para a aba

## Problema
Quando o usuário saía da aba e voltava, o `onAuthStateChange` disparava e chamava `loadCurrentUser()`, que tentava fazer `getSession()` novamente, resultando em timeout de 3 segundos.

## Causa Raiz
O `onAuthStateChange` do Supabase dispara vários eventos:
- `SIGNED_IN` - quando faz login
- `SIGNED_OUT` - quando faz logout  
- `TOKEN_REFRESHED` - quando o token é renovado (a cada 1h)
- `USER_UPDATED` - quando dados do usuário mudam
- **`INITIAL_SESSION`** - quando volta à aba ✖️

O código antigo chamava `loadCurrentUser()` para TODOS os eventos, incluindo quando voltava à aba.

## Solução Aplicada

### Antes:
```typescript
onAuthStateChange(async (_event, session) => {
  if (session?.user) {
    const profileUser = await loadCurrentUser(); // ❌ Chama getSession()
    setUser(profileUser);
  } else {
    setUser(null);
  }
});
```

### Depois:
```typescript
onAuthStateChange(async (event, session) => {
  // Filtra apenas eventos relevantes
  if (event === 'SIGNED_IN' && session?.user) {
    // Usa dados direto da session, sem chamar getSession()
    const profileUser: User = {
      id: session.user.id,
      email: session.user.email || '',
      name: session.user.user_metadata?.name || '',
      userType: session.user.user_metadata?.user_type || 'patient',
      createdAt: session.user.created_at || new Date().toISOString(),
    };
    setUser(profileUser);
  } else if (event === 'SIGNED_OUT') {
    setUser(null);
  }
  // Ignora TOKEN_REFRESHED, USER_UPDATED, etc.
});
```

## Benefícios
✅ **Não chama `getSession()` desnecessariamente**  
✅ **Evita timeouts ao voltar para a aba**  
✅ **Melhor performance** - usa dados da sessão diretamente  
✅ **UX mais fluída** - sem delays de 3s  

## Resultado Esperado
- ✅ Login funciona normalmente
- ✅ Logout funciona normalmente
- ✅ Voltar à aba **não causa timeout**
- ✅ Token refresh automático não interfere

---

**Status**: ✅ Corrigido
**Data**: 2025-11-07

