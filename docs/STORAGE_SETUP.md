# 📦 Configuração do Supabase Storage para Fotos

Este guia explica como configurar o armazenamento de fotos no Supabase.

## 🎯 O que foi implementado

✅ **Upload automático** de fotos locais para Supabase Storage  
✅ **Organização** por pasta de usuário (`userId/timestamp.jpg`)  
✅ **Suporte a URLs** externas (Unsplash, etc.)  
✅ **Exclusão automática** ao deletar check-in  
✅ **Atualização inteligente** (remove foto antiga ao atualizar)  
✅ **Limite de 5MB** por foto  
✅ **Formatos**: PNG, JPEG, JPG, WebP  

---

## 🔧 Configuração no Supabase Dashboard

### Opção 1: Criação Automática (Recomendado)

O bucket será criado automaticamente na primeira vez que alguém tentar fazer upload. Você pode verificar se existe acessando:

1. Acesse [Supabase Dashboard](https://app.supabase.com/)
2. Selecione seu projeto **DietCats**
3. No menu lateral, clique em **Storage**
4. Você verá o bucket `meal-photos` (ou será criado automaticamente)

### Opção 2: Criação Manual

Se preferir criar manualmente:

1. Acesse **Storage** no Dashboard
2. Clique em **New bucket**
3. Configure:
   - **Name**: `meal-photos`
   - **Public bucket**: ✅ Marcado (para URLs públicas)
   - **Allowed MIME types**: `image/png,image/jpeg,image/jpg,image/webp`
   - **File size limit**: `5MB`
4. Clique em **Create bucket**

### Configurar Políticas (RLS)

Para permitir que usuários façam upload de suas próprias fotos:

1. Clique no bucket `meal-photos`
2. Vá em **Policies**
3. Clique em **New Policy**

**Policy 1: Upload (INSERT)**
```sql
CREATE POLICY "Users can upload their own photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'meal-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Policy 2: Leitura (SELECT)**
```sql
CREATE POLICY "Photos are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'meal-photos');
```

**Policy 3: Exclusão (DELETE)**
```sql
CREATE POLICY "Users can delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'meal-photos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 📝 Como funciona no código

### 1. Upload de Foto Local

Quando o usuário tira uma foto ou escolhe da galeria:

```typescript
// CheckInScreen.tsx
const photoUri = 'file:///storage/photo.jpg'; // Foto local

// MealService.ts
await mealService.addCheckIn({
  mealType: 'Almoço',
  photo: photoUri, // Passa a URI local
  // ...
});

// Internamente:
// 1. StorageService detecta que é arquivo local
// 2. Lê o arquivo como base64
// 3. Faz upload para Supabase Storage
// 4. Retorna URL pública: https://[projeto].supabase.co/storage/v1/object/public/meal-photos/[userId]/[timestamp].jpg
// 5. Salva a URL pública no banco de dados
```

### 2. URL Externa (Unsplash)

Se o usuário escolher foto da internet:

```typescript
const photoUri = 'https://images.unsplash.com/photo-123456';

// MealService.ts
await mealService.addCheckIn({
  mealType: 'Jantar',
  photo: photoUri, // Passa a URL externa
  // ...
});

// Internamente:
// 1. StorageService detecta que já é URL (começa com http/https)
// 2. Não faz upload, apenas salva a URL no banco
```

### 3. Exclusão de Foto

Quando o usuário deleta um check-in:

```typescript
await mealService.deleteCheckIn(checkInId);

// Internamente:
// 1. Busca a photo_url do banco
// 2. Deleta o registro do banco
// 3. Se a foto é do Storage (não externa), deleta do Storage também
```

---

## 🗂️ Estrutura no Storage

```
meal-photos/
├── [user-id-1]/
│   ├── 1699999999999.jpg
│   ├── 1700000000000.png
│   └── 1700000000001.jpg
├── [user-id-2]/
│   ├── 1699999999999.jpg
│   └── 1700000000000.jpg
└── ...
```

Cada usuário tem sua própria pasta identificada pelo UUID.

---

## 🔍 Verificando no Dashboard

Para ver as fotos enviadas:

1. Acesse **Storage** → `meal-photos`
2. Você verá as pastas por usuário (UUID)
3. Clique em uma pasta para ver as fotos
4. Clique em uma foto para ver detalhes e copiar a URL pública

---

## ⚠️ Troubleshooting

### Erro: "Bucket does not exist"

**Solução**: Crie o bucket manualmente seguindo a Opção 2 acima.

### Erro: "new row violates row-level security policy"

**Solução**: Configure as políticas (RLS) conforme descrito acima.

### Erro: "File size exceeds limit"

**Solução**: A foto tem mais de 5MB. Você pode:
- Aumentar o limite no bucket (Settings → File size limit)
- Comprimir a foto antes de enviar

### Upload demora muito

**Solução**: 
- Use qualidade menor na câmera (já configurado em 0.8)
- Verifique sua conexão com a internet
- Considere comprimir imagens grandes

---

## 📊 Monitoramento

Para ver o espaço usado:

1. **Por usuário**:
```typescript
const size = await StorageService.getUserStorageSize(userId);
console.log(`Espaço usado: ${size / 1024 / 1024} MB`);
```

2. **No Dashboard**:
   - Acesse **Storage** → `meal-photos`
   - Veja "Storage used" no topo

---

## 🚀 Próximos Passos (Opcional)

### Otimizações Futuras:

1. **Compressão de imagens** (reduzir tamanho)
2. **Thumbnails** (versões pequenas para listagens)
3. **Lazy loading** (carregar fotos sob demanda)
4. **Cache local** (guardar fotos visitadas)
5. **Limit por usuário** (ex: máximo 100 fotos)

---

## 🎉 Pronto!

Agora as fotos são:
- ✅ Persistidas permanentemente no Supabase
- ✅ Acessíveis de qualquer dispositivo
- ✅ Organizadas por usuário
- ✅ Com URLs públicas compartilháveis
- ✅ Gerenciadas automaticamente (inclusão/exclusão)



