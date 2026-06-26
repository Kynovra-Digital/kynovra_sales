---
name: supabase-storage-uploads
description: Use quando implementar ou corrigir upload de imagens e arquivos para Supabase Storage no Kynovra Sales.
compatibility: opencode
metadata:
  project: kynovra-sales
  area: storage
---

# Supabase Storage Uploads

Use esta skill para qualquer upload.

## Regra obrigatória

Todo arquivo deve ir para Supabase Storage.
O banco deve guardar URL pública ou path seguro.

Nunca salvar base64 no banco.
Nunca manter imagem apenas no estado local.

## Buckets

- product-images: imagens de produto
- campaign-banners: banners de campanha
- organization-logos: logos
- avatars: fotos de perfil
- public-assets: ativos públicos
- support-attachments: anexos de suporte

## Fluxo correto

1. Validar arquivo.
2. Definir bucket correto.
3. Criar nome seguro com UUID.
4. Fazer upload.
5. Obter public URL ou path.
6. Salvar no banco.
7. Invalidar query.
8. Mostrar toast.

## Campos esperados

Produtos:

- `products.image_url`

Campanhas:

- `campaigns.banner_url`

Organização:

- `organization_settings.logo_url`

Perfil:

- `profiles.avatar_url`
