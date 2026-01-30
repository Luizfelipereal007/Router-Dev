# Router Dev - Dashboard de Projetos

Dashboard local para desenvolvedores gerenciar projetos e seus links de acesso.

## 🚀 Tecnologias

- **Frontend**: Next.js 16 + React + TypeScript + TailwindCSS
- **Backend**: API Routes do próprio Next.js (Node.js runtime)
- **Banco de Dados**: SQLite (better-sqlite3)

## 📋 Funcionalidades

- ✅ CRUD completo de Projetos
- ✅ CRUD completo de Links por projeto
- ✅ Links do tipo NORMAL (abre URL no navegador)
- ✅ Links do tipo TERMINAL (dropdown com opções: abrir projeto no VS Code ou acessar URL)
- ✅ Sidebar com navegação entre projetos
- ✅ Interface responsiva e moderna

## 🛠️ Instalação

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalar tudo + iniciar (um comando)

```bash
npm run install:all
npm run dev
```

O app estará rodando em `http://localhost:3000`

### Rodar com hostname `routerdev`

1) Adicione no seu `/etc/hosts`:

```bash
sudo sh -c 'echo "127.0.0.1 routerdev" >> /etc/hosts'
```

2) Inicie:

```bash
npm run dev:routerdev
```

Acesse `http://routerdev:3000`.

## 📖 Como Usar

### Criar um Projeto

1. Clique em "Novo Projeto" na sidebar ou na home
2. Preencha o nome do projeto
3. Informe o caminho absoluto do projeto no sistema de arquivos (ex: `/home/usuario/projetos/meu-projeto`)
4. Clique em "Criar Projeto"

### Adicionar Links a um Projeto

1. Clique em um projeto na sidebar ou na home
2. Clique em "+ Cadastrar Link"
3. Preencha:
   - **Nome**: Ex: DEV, HOM, PRD
   - **URL**: URL completa (apenas para tipo NORMAL)
   - **Tipo**: NORMAL ou TERMINAL
4. Clique em "Criar"

### Links do Tipo TERMINAL

Links do tipo TERMINAL têm um dropdown especial com duas opções:

- **Abrir Projeto**: Executa `code .` no diretório do projeto (abre VS Code)
- **Acessar Link**: Abre a URL cadastrada no navegador

### Editar ou Deletar

- **Editar**: Clique no botão "Editar" ao lado do link
- **Deletar**: Clique no botão "Deletar" ao lado do link

## 🗂️ Estrutura do Projeto

```
Router-Dev/
├── backend/
│   ├── src/
│   │   └── index.ts          # API REST
│   ├── data/
│   │   └── dashboard.sqlite  # Banco de dados SQLite
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx        # Layout com sidebar
│   │   ├── page.tsx          # Home (lista projetos)
│   │   └── projects/
│   │       ├── [id]/page.tsx # Página do projeto
│   │       └── new/page.tsx  # Criar novo projeto
│   ├── components/
│   │   ├── Sidebar.tsx       # Sidebar de navegação
│   │   ├── LinkForm.tsx      # Formulário de links
│   │   ├── LinkItem.tsx      # Item de link na lista
│   │   └── TerminalDropdown.tsx # Dropdown para links TERMINAL
│   └── types/
│       └── index.ts          # Tipos TypeScript
└── README.md
```

## 🔌 API Endpoints

### Projetos

- `GET /projects` - Lista todos os projetos com seus links
- `POST /projects` - Cria um novo projeto
- `PUT /projects/:id` - Atualiza um projeto
- `DELETE /projects/:id` - Deleta um projeto

### Links

- `GET /links/:id` - Busca um link específico
- `POST /projects/:projectId/links` - Cria um novo link
- `PUT /links/:id` - Atualiza um link
- `DELETE /links/:id` - Deleta um link
- `POST /links/:id/terminal` - Executa `code .` no diretório do projeto

## ⚙️ Configuração

### Variáveis de Ambiente

Não é necessário configurar variáveis para a API (ela roda em `/api` no mesmo Next).

## 📝 Notas

- O sistema é **exclusivamente local** - não há autenticação
- O backend valida se o caminho do projeto existe antes de salvar
- Links TERMINAL requerem que o comando `code` esteja disponível no PATH do sistema
- O banco de dados SQLite é criado automaticamente em `frontend/data/dashboard.sqlite`

## 🐛 Troubleshooting

### Erro ao abrir terminal

Certifique-se de que o comando `code` está disponível no PATH:
```bash
which code
```

Se não estiver, adicione o VS Code ao PATH ou ajuste o código em `backend/src/index.ts`.

### Observação

A pasta `backend/` (Express) pode ser desconsiderada agora — a aplicação passou a usar apenas o Next para API + UI.

### Projeto não encontrado

Verifique se o caminho do projeto está correto e existe no sistema de arquivos.
