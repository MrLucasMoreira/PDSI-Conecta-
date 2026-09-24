# Dicionário de Dados - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Banco de Dados:** MongoDB (Mongoose ODM)  
> **Versão:** 1.0

---

## Sumário de Coleções/Entidades

| Coleção | Descrição | Documento Principal |
|---------|-----------|---------------------|
| `usuarios` | Contas de acesso à plataforma | `Usuario` |
| `organizacoes` | Organizações com membros embutidos | `Organizacao` + `MembroOrganizacao` (embedded) |

---

## 1. Coleção `usuarios`

### 1.1 Estrutura do Documento

| Campo | Tipo | Obrig. | Índice | Descrição |
|-------|------|--------|--------|-----------|
| `_id` | `ObjectId` | Sim | PK | Identificador único gerado pelo MongoDB |
| `nome` | `String` | Sim | - | Nome completo do usuário (trim, max 100) |
| `email` | `String` | Sim | Único, Lowercase | Email único, normalizado para minúsculas |
| `senha_hash` | `String` | Sim | - | Hash bcrypt da senha (cost 10), `select: false` |
| `senhaHash` | `String?` | Não | - | **Legado** - compatibilidade com contas antigas, `select: false` |
| `tipo` | `Enum(TipoUsuario)` | Sim | - | `USUARIO` (padrão) ou `ADMIN_SISTEMA` |
| `tema` | `Enum(TemaUsuario)` | Sim | - | `SISTEMA` (padrão), `CLARO`, `ESCURO` |
| `reset_senha_token_hash` | `String?` | Não | - | Hash SHA-256 do token de recuperação, `select: false` |
| `reset_senha_expira_em` | `Date?` | Não | - | Expiração do token (30 min), `select: false` |
| `ativo` | `Boolean` | Sim | - | `true` (padrão) - conta ativa/desativada |
| `criado_em` | `Date` | Sim | - | Timestamp de criação (auto via `timestamps`) |
| `atualizado_em` | `Date` | Sim | - | Timestamp de última atualização (auto via `timestamps`) |

### 1.2 Enums Relacionados

#### `TipoUsuario`
| Valor | Descrição |
|-------|-----------|
| `USUARIO` | Usuário comum da plataforma |
| `ADMIN_SISTEMA` | Administrador global (gerencia organizações, não participa) |

#### `TemaUsuario`
| Valor | Descrição |
|-------|-----------|
| `CLARO` | Tema claro forçado |
| `ESCURO` | Tema escuro forçado |
| `SISTEMA` | Segue preferência do SO (padrão) |

### 1.3 Regras de Validação (Mongoose)
- `nome`: required, trim
- `email`: required, unique, lowercase, trim
- `senha_hash`: required, select: false
- `tipo`: enum `TipoUsuario`, default `USUARIO`
- `tema`: enum `TemaUsuario`, default `SISTEMA`
- `ativo`: default `true`

### 1.4 Índices
```javascript
// Índice único case-insensitive no email
{ email: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } }
```

### 1.5 DTOs de Entrada/Saída

#### `CreateUsuarioDto` (POST /usuarios)
| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | String | Obrigatório, trim |
| `email` | String | Obrigatório, email válido, unique |
| `senha` | String | Obrigatório, min 8 caracteres |
| `tema` | TemaUsuario? | Opcional, default `SISTEMA` |

#### `UpdateUsuarioDto` (PATCH /usuarios/:id - AdminSistema)
| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | String? | Trim |
| `email` | String? | Email válido, unique (exceto próprio) |
| `tipo` | TipoUsuario? | Enum |
| `tema` | TemaUsuario? | Enum |
| `ativo` | Boolean? | - |
| `senha` | String? | Min 8 chars (re-hash) |

#### `AtualizarPerfilDto` (PATCH /usuarios/me - Próprio usuário)
| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | String? | Trim |
| `email` | String? | Email válido, unique (exceto próprio) |
| `tema` | TemaUsuario? | Enum |

#### `AlterarSenhaDto` (PATCH /usuarios/me/senha)
| Campo | Tipo | Regras |
|-------|------|--------|
| `senha_atual` | String | Obrigatório, confere com hash |
| `nova_senha` | String | Obrigatório, min 8, diferente da atual |

---

## 2. Coleção `organizacoes`

### 2.1 Estrutura do Documento Principal

| Campo | Tipo | Obrig. | Índice | Descrição |
|-------|------|--------|--------|-----------|
| `_id` | `ObjectId` | Sim | PK | Identificador único |
| `nome` | `String` | Sim | Único (case-insensitive) | Nome da organização (trim, 2-100 chars) |
| `descricao` | `String?` | Não | - | Descrição opcional (max 200 chars) |
| `status` | `Enum(StatusOrganizacao)` | Sim | - | `PENDENTE` (padrão), `APROVADA`, `REVOGADA` |
| `criada_por` | `ObjectId` | Sim | Ref: Usuario | Admin do sistema que criou |
| `membros` | `MembroOrganizacao[]` | Sim | - | Array de membros embutidos (ver 2.2) |
| `criado_em` | `Date` | Sim | - | Timestamp criação (auto) |
| `atualizado_em` | `Date` | Sim | - | Timestamp atualização (auto) |

### 2.2 Subdocumento `MembroOrganizacao` (Embedded Array)

| Campo | Tipo | Obrig. | Default | Descrição |
|-------|------|--------|---------|-----------|
| `usuario_id` | `ObjectId` | Sim | - | Ref: Usuario |
| `papel` | `Enum(PapelOrganizacao)` | Sim | - | `ADMIN` ou `MEMBRO` |
| `status` | `Enum(StatusMembroOrganizacao)` | Sim | `PENDENTE` | Status do vínculo |
| `solicitado_em` | `Date` | Sim | `Date.now()` | Data da solicitação/adição |
| `aprovado_em` | `Date?` | Não | - | Preenchido apenas ao aprovar (`APROVADO`) |

### 2.3 Enums Relacionados

#### `StatusOrganizacao`
| Valor | Descrição | Permite Solicitações? | Permite Gestão Membros? |
|-------|-----------|----------------------|------------------------|
| `PENDENTE` | Aguardando aprovação do Admin Sistema | Não | Não |
| `APROVADA` | Ativa, operacional | **Sim** | **Sim** |
| `REVOGADA` | Desativada pelo Admin Sistema | Não | Não (pré-requisito p/ exclusão) |

#### `PapelOrganizacao`
| Valor | Descrição | Permissões |
|-------|-----------|------------|
| `ADMIN` | Administrador da organização | Aprovar/rejeitar/remover membros, gerenciar comissões |
| `MEMBRO` | Membro comum | Participar de comissões, visualizar conteúdo |

#### `StatusMembroOrganizacao`
| Valor | Descrição | Próximos Estados Possíveis |
|-------|-----------|---------------------------|
| `PENDENTE` | Aguardando análise do admin da org | `APROVADO`, `REJEITADO` |
| `APROVADO` | Acesso liberado | `REJEITADO` (via remoção), remoção |
| `REJEITADO` | Acesso negado | Pode solicitar novamente (novo vínculo `PENDENTE`) |

### 2.4 Regras de Validação (Mongoose)
- `nome`: required, trim, min 2, max 100, único (regex case-insensitive)
- `descricao`: opcional, max 200
- `status`: enum `StatusOrganizacao`, default `PENDENTE`
- `criada_por`: required, ref `Usuario`
- `membros`: array de `MembroOrganizacao`, default `[]`

#### `MembroOrganizacao` (subschema)
- `usuario_id`: required, ref `Usuario`
- `papel`: required, enum `PapelOrganizacao`
- `status`: enum `StatusMembroOrganizacao`, default `PENDENTE`
- `solicitado_em`: default `Date.now`
- `aprovado_em`: opcional

### 2.5 Índices
```javascript
// Nome único case-insensitive
{ nome: 1 }, { unique: true, collation: { locale: 'pt', strength: 2 } }

// Consultas frequentes
{ status: 1 }
{ 'membros.usuario_id': 1 }
{ criada_por: 1 }
```

### 2.6 DTOs de Entrada/Saída

#### `CreateOrganizacaoDto` (POST /organizacoes - UsuarioComum)
| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | String | Obrigatório, 2-100 chars, trim, único |
| `descricao` | String? | Opcional, max 200, trim |

#### `UpdateOrganizacaoDto` (PATCH /organizacoes/:id - AdminSistema)
| Campo | Tipo | Regras |
|-------|------|--------|
| `nome` | String? | 2-100 chars, trim, único (exceto próprio) |
| `descricao` | String? | Max 200, trim |

#### `UpdateStatusMembroDto` (PATCH /organizacoes/:id/membros/:usuarioId - AdminOrg)
| Campo | Tipo | Regras |
|-------|------|--------|
| `status` | StatusMembroOrganizacao | Obrigatório, apenas `APROVADO` ou `REJEITADO` |

---

## 3. Relacionamentos e Cardinalidades

```
Usuario (1) ─────< (N) Organizacao : criada_por
    │
    └─< (N) MembroOrganizacao : usuario_id (embutido em Organizacao)

Organizacao (1) ─────< (N) MembroOrganizacao : membros (array embutido)
    │
    └─< (N) Comissao : organizacao_id (coleção separada)

MembroOrganizacao (N) ───> (1) Usuario : usuario_id
MembroOrganizacao (N) ───> (1) Organizacao : (pai do array)
```

**Observação:** `MembroOrganizacao` é **embutido** (embedded) no documento `Organizacao`, não é coleção separada. Isso garante atomicidade nas operações de aprovação/rejeição/remoção via `arrayFilters`.

---

## 4. Fluxos de Estado (State Transitions)

### 4.1 Organização
```
PENDENTE ──(AdminSistema aprova)──> APROVADA ──(AdminSistema revoga)──> REVOGADA ──(AdminSistema exclui)──> [DELETADA]
    │                                                                              │
    └──────────────────(AdminSistema exclui direto se REVOGADA)───────────────────┘
```

### 4.2 Vínculo Membro (MembroOrganizacao)
```
[Não existe] ──(Usuário solicita / Admin adiciona)──> PENDENTE ──(AdminOrg aprova)──> APROVADO
    │                                                                      │
    │                                                                      ├─(AdminOrg remove)──> [Removido]
    │                                                                      │
    └──────────────────────(AdminOrg rejeita)──────────────────────────────> REJEITADO ──(Usuário solicita novamente)──> PENDENTE (novo vínculo)
```

---

## 5. Constraints de Negócio Implementadas no Código

| Regra | Onde Implementada | Descrição |
|-------|-------------------|-----------|
| RN-01 | `UsuarioService.criar` + índice único | Email único case-insensitive |
| RN-15 | `OrganizacoesService.adicionarMembro` | Só org `APROVADA` aceita solicitações |
| RN-16 | `adicionarMembro` + `arrayFilters` | Um vínculo por usuário por org (concorrência) |
| RN-22/23 | `exigirAdministrador` + `exigirOrganizacaoAprovada` | Só ADMIN aprovado em org APROVADA gerencia membros |
| RN-25/29 | `atualizarStatusMembro` + `arrayFilters` | Só ADMIN da mesma org aprova/rejeita; só PENDENTE |
| RN-35 | `removerMembro` | Não remove ADMIN da org |
| RN-37 | `removerMembro` + `ComissaoModel.updateMany` | Cascata: remove de comissões da org |
| RN-39 | `UsuarioComumGuard` | Só ADMIN_SISTEMA cria orgs |
| RN-42 | `criar` | Nova org nasce PENDENTE; criador = ADMIN aprovado |
| RN-45/47/50 | `AdminSistemaGuard` | Só ADMIN_SISTEMA aprova/revoga/exclui orgs |
| RN-51 | `remover` + filtro `status: REVOGADA` | Exclusão só se revogada |

---

## 6. Segurança e Auditoria

| Aspecto | Implementação |
|---------|---------------|
| **Senha** | bcrypt hash (cost 10), nunca logada, `select: false` |
| **Token JWT** | Claims: `sub` (userId), `email`, `tipo`; renovado a cada request (tipo vem do DB) |
| **Recuperação senha** | Token aleatório 32 bytes → SHA-256 hash no DB → expira 30 min → uso único |
| **Rate limiting** | A implementar no gateway/API (não no código atual) |
| **Soft delete usuário** | `ativo: false` (não deleta documento) |
| **Hard delete organização** | Só após `REVOGADA`; deleta comissões em cascata |

---

## 7. Exemplos de Documentos JSON

### 7.1 Usuario
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
  "nome": "João Silva",
  "email": "joao@empresa.com",
  "senha_hash": "$2b$10$X7Y8Z9...",
  "tipo": "USUARIO",
  "tema": "SISTEMA",
  "ativo": true,
  "criado_em": "2024-09-01T10:30:00.000Z",
  "atualizado_em": "2024-09-15T14:22:00.000Z"
}
```

### 7.2 Organizacao (com membros embutidos)
```json
{
  "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
  "nome": "Empresa Alpha",
  "descricao": "Organização de exemplo",
  "status": "APROVADA",
  "criada_por": "64f1a2b3c4d5e6f7g8h9i0j1",
  "membros": [
    {
      "usuario_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "papel": "ADMIN",
      "status": "APROVADO",
      "solicitado_em": "2024-09-01T10:30:00.000Z",
      "aprovado_em": "2024-09-01T10:30:00.000Z"
    },
    {
      "usuario_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "papel": "MEMBRO",
      "status": "PENDENTE",
      "solicitado_em": "2024-09-10T08:15:00.000Z"
    },
    {
      "usuario_id": "64f1a2b3c4d5e6f7g8h9i0j4",
      "papel": "MEMBRO",
      "status": "APROVADO",
      "solicitado_em": "2024-09-05T12:00:00.000Z",
      "aprovado_em": "2024-09-05T14:30:00.000Z"
    }
  ],
  "criado_em": "2024-09-01T10:30:00.000Z",
  "atualizado_em": "2024-09-10T08:15:00.000Z"
}
```

---

## 8. Mapeamento Frontend (TypeScript Types)

```typescript
// services/api.ts
export type Organizacao = {
  _id: string;
  nome: string;
  descricao?: string;
  status: 'PENDENTE' | 'APROVADA' | 'REVOGADA';
  criada_por?: { nome: string } | null;
  meu_vinculo?: { papel: 'ADMIN' | 'MEMBRO'; status: StatusVinculo } | null;
  membros?: {
    usuario_id: { _id: string; nome: string; email: string };
    papel: 'ADMIN' | 'MEMBRO';
    status: StatusVinculo;
  }[];
};

export type StatusVinculo = 'PENDENTE' | 'APROVADO' | 'REJEITADO';
```

---

## 9. Versionamento e Migrações

| Versão | Data | Alteração |
|--------|------|-----------|
| 1.0 | 2024-09 | Estrutura inicial: Usuario, Organizacao, MembroOrganizacao (embedded) |
| - | - | Campo `senhaHash` mantido para compatibilidade legada |
| - | - | Índices case-insensitive via collation `pt` strength 2 |

---

*Dicionário gerado a partir da análise dos schemas Mongoose (`usuario.schema.ts`, `organizacao.schema.ts`), services, DTOs e guards do backend NestJS.*