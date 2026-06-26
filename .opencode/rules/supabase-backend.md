# Supabase Backend

Supabase é todo o backend do projeto.

Não criar backend local em Next.js.

Tudo que for regra de negócio deve ser:

- RPC PostgreSQL
- RLS
- policies
- Edge Functions
- Realtime
- Storage
- Auth

Frontend só consome Supabase.

Proibido:

- app/api operacional
- mocks finais
- API key no frontend
- service role no client
- lógica crítica no Zustand
- IA chamada direto do frontend
