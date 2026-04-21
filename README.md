# Sou Concursado - Plataforma de Estudos

Esta é uma plataforma completa para concurseiros, com foco em questões reais, flashcards e desempenho.

## Tecnologias

- **Frontend**: Next.js 14, Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: Node.js, Express, Prisma, PostgreSQL (Configurado).

## Como Executar

### Backend
1. Navegue até a pasta `backend`: `cd backend`
2. Instale as dependências: `npm install`
3. Configure o seu banco de dados PostgreSQL no arquivo `.env`.
4. Gere o cliente Prisma: `npx prisma generate`
5. Execute as migrações: `npx prisma migrate dev`
6. Inicie o servidor: `npm run dev` (ou `ts-node src/index.ts`)

### Frontend
1. Navegue até a pasta `frontend`: `cd frontend`
2. Instale as dependências: `npm install`
3. Inicie o servidor de desenvolvimento: `npm run dev`
4. Acesse `http://localhost:3000`

## Funcionalidades Implementadas
- [x] Landing Page Premium
- [x] Dashboard de Usuário
- [x] Busca e Filtro de Concursos
- [x] Sistema de Resolução de Questões com Feedback
- [x] Flashcards com Repetição Espaçada (SM-2)
- [x] Autenticação JWT (Estrutura Completa)
