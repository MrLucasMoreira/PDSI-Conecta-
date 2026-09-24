# Dicionário de Dados - Visão Relacional (Modelo Lógico)

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Base:** Modelo lógico relacional derivado do MongoDB (documentos embutidos)  
> **Versão:** 1.0

---

## Sumário de Tabelas/Entidades

| Tabela (Entidade) | Tipo | Origem MongoDB | Descrição |
|-------------------|------|----------------|-----------|
| `usuario` | Forte (Principal) | Coleção `usuarios` | Contas de acesso à plataforma |
| `organizacao` | Forte (Principal) | Coleção `organizacoes` | Organizações cadastradas |
| `membro_organizacao` | Fraca (Associativa) | Array embutido `organizacoes.membros[]` | Vínculos usuário-organização |

---

## 1. Tabela `usuario`

### 1.1 Definição das Colunas

| # | Coluna | Tipo de Dado | Tamanho | Nulo | Chave | Default | Descrição / Regras |
|---|--------|--------------|---------|------|-------|---------|-------------------|
| 1 | `_id` | `OBJECTID` | 12 bytes | Não | **PK** | Auto (ObjectId) | Identificador único global |
| 2 | `nome` | `VARCHAR` | 100 | Não | - | - | Nome completo, `TRIM` |
| 3 | `email` | `VARCHAR` | 255 | Não | **UK** | - | Email único, `LOWERCASE`, `TRIM`, case-insensitive (collation pt) |
| 4 | `senha_hash` | `VARCHAR` | 255 | Não | - | - | Hash **bcrypt cost 10**, nunca exposto em queries (`select: false`) |
| 5 | `senha_hash_legado` | `VARCHAR` | 255 | Sim | - | NULL | Compatibilidade contas antigas (campo `senhaHash`), `select: false` |
| 6 | `tipo` | `ENUM` | - | Não | - | `'USUARIO'` | `'USUARIO'` \| `'ADMIN_SISTEMA'` |
| 7 | `tema` | `ENUM` | - | Não | - | `'SISTEMA'` | `'CLARO'` \| `'ESCURO'` \| `'SISTEMA'` |
| 8 | `reset_senha_token_hash` | `VARCHAR` | 64 | Sim | - | NULL | SHA-256 do token de recuperação (hex), `select: false` |
| 9 | `reset_senha_expira_em` | `DATETIME` | - | Sim | - | NULL | Expiração token recuperação (30 min), `select: false` |
| 10 | `ativo` | `BOOLEAN` | - | Não | - | `TRUE` | `TRUE`=ativo, `FALSE`=desativado (soft delete) |
| 11 | `criado_em` | `DATETIME` | - | Não | - | `CURRENT_TIMESTAMP` | Auditoria: criação (auto via `timestamps`) |
| 12 | `atualizado_em` | `DATETIME` | - | Não | - | `CURRENT_TIMESTAMP` | Auditoria: última atualização (auto via `timestamps`) |

### 1.2 Restrições (Constraints)

| Nome | Tipo | Coluna(s) | Descrição |
|------|------|-----------|-----------|
| `PK_usuario` | PRIMARY KEY | `_id` | Identificador único |
| `UK_usuario_email` | UNIQUE | `email` | Email único case-insensitive (collation `pt`, strength 2) |
| `CK_usuario_tipo` | CHECK | `tipo` | Valores permitidos: `USUARIO`, `ADMIN_SISTEMA` |
| `CK_usuario_tema` | CHECK | `tema` | Valores permitidos: `CLARO`, `ESCURO`, `SISTEMA` |
| `CK_usuario_ativo` | CHECK | `ativo` | Valores permitidos: `TRUE`, `FALSE` |

### 1.3 Índices

| Nome | Coluna(s) | Tipo | Descrição |
|------|-----------|------|-----------|
| `IDX_usuario_email` | `email` | UNIQUE | Busca por login, recuperação de senha |
| `IDX_usuario_tipo` | `tipo` | NORMAL | Filtro por tipo de usuário |
| `IDX_usuario_ativo` | `ativo` | NORMAL | Filtro contas ativas |

### 1.4 Regras de Negócio Associadas

| Código | Regra | Onde Validada |
|--------|-------|---------------|
| RN-01 | Email único no sistema | `UsuarioService.criar` + índice único |
| RN-02 | Senha mínimo 8 caracteres | DTO validation + service |
| RN-03 | Usuário criado como `USUARIO` | `UsuarioService.criar` (default) |
| RN-04 | Senha armazenada com bcrypt cost 10 | `UsuarioService.criar` / `atualizar` |
| RN-05 | Token JWT inclui `tipo` atual do banco | `JwtAuthGuard` renova `tipo` a cada request |
| RN-06 | Email normalizado lowercase | `UsuarioService.criar` / `atualizar` / `AuthService.login` |
| RN-07 | Conta legada sem senha → usar recuperação | `AuthService.login` / `UsuarioService.alterarSenha` |

---

## 2. Tabela `organizacao`

### 2.1 Definição das Colunas

| # | Coluna | Tipo de Dado | Tamanho | Nulo | Chave | Default | Descrição / Regras |
|---|--------|--------------|---------|------|-------|---------|-------------------|
| 1 | `_id` | `OBJECTID` | 12 bytes | Não | **PK** | Auto (ObjectId) | Identificador único global |
| 2 | `nome` | `VARCHAR` | 100 | Não | **UK** | - | Nome único, `TRIM`, min 2, max 100, case-insensitive |
| 3 | `descricao` | `VARCHAR` | 200 | Sim | - | NULL | Descrição opcional, `TRIM` |
| 4 | `status` | `ENUM` | - | Não | - | `'PENDENTE'` | `'PENDENTE'` \| `'APROVADA'` \| `'REVOGADA'` |
| 5 | `criada_por` | `OBJECTID` | 12 bytes | Não | **FK** | - | Referência `usuario._id` (Admin do Sistema) |
| 6 | `criado_em` | `DATETIME` | - | Não | - | `CURRENT_TIMESTAMP` | Auditoria: criação (auto via `timestamps`) |
| 7 | `atualizado_em` | `DATETIME` | - | Não | - | `CURRENT_TIMESTAMP` | Auditoria: atualização (auto via `timestamps`) |

### 2.2 Restrições (Constraints)

| Nome | Tipo | Coluna(s) | Descrição |
|------|------|-----------|-----------|
| `PK_organizacao` | PRIMARY KEY | `_id` | Identificador único |
| `UK_organizacao_nome` | UNIQUE | `nome` | Nome único case-insensitive (collation `pt`, strength 2) |
| `FK_organizacao_criada_por` | FOREIGN KEY | `criada_por` → `usuario._id` | Admin do Sistema criador deve existir |
| `CK_organizacao_status` | CHECK | `status` | Valores: `PENDENTE`, `APROVADA`, `REVOGADA` |

### 2.3 Índices

| Nome | Coluna(s) | Tipo | Descrição |
|------|-----------|------|-----------|
| `IDX_organizacao_status` | `status` | NORMAL | Listagem por status (PENDENTE/APROVADA/REVOGADA) |
| `IDX_organizacao_criada_por` | `criada_por` | NORMAL | Organizações criadas por um admin |

### 2.4 Regras de Negócio Associadas

| Código | Regra | Onde Validada |
|--------|-------|---------------|
| RN-39 | Apenas `ADMIN_SISTEMA` cria organizações | `UsuarioComumGuard` bloqueia non-admins |
| RN-40 | Nome único case-insensitive | `exigirNomeDisponivel` + índice único |
| RN-41 | Criador vira `ADMIN` aprovado automaticamente | `OrganizacoesService.criar` |
| RN-42 | Nova org nasce `PENDENTE` | `OrganizacoesService.criar` (default) |
| RN-45 | Apenas `ADMIN_SISTEMA` aprova org | `AdminSistemaGuard` no `PATCH /organizacoes/:id` |
| RN-47 | Apenas `ADMIN_SISTEMA` revoga org | `AdminSistemaGuard` |
| RN-50 | Apenas `ADMIN_SISTEMA` exclui org | `AdminSistemaGuard` |
| RN-51 | Exclusão só se `status = REVOGADA` | `OrganizacoesService.remover` (filtro no `deleteOne`) |
| RN-52 | Exclusão cascata comissões | `ComissaoModel.deleteMany({ organizacao_id })` |

---

## 3. Tabela `membro_organizacao` (Entidade Fraca / Associativa)

> **Nota:** No MongoDB físico, esta é um **array de subdocumentos embutido** no documento `organizacao` (`organizacoes.membros[]`). Não existe coleção separada. O modelo relacional abaixo representa a estrutura lógica para fins de documentação e integridade.

### 3.1 Definição das Colunas

| # | Coluna | Tipo de Dado | Tamanho | Nulo | Chave | Default | Descrição / Regras |
|---|--------|--------------|---------|------|-------|---------|-------------------|
| 1 | `organizacao_id` | `OBJECTID` | 12 bytes | Não | **PK, FK** | - | Organização proprietária (pai do array) |
| 2 | `usuario_id` | `OBJECTID` | 12 bytes | Não | **PK, FK** | - | Usuário vinculado → `usuario._id` |
| 3 | `papel` | `ENUM` | - | Não | - | - | `'ADMIN'` \| `'MEMBRO'` |
| 4 | `status` | `ENUM` | - | Não | - | `'PENDENTE'` | `'PENDENTE'` \| `'APROVADO'` \| `'REJEITADO'` |
| 5 | `solicitado_em` | `DATETIME` | - | Não | - | `CURRENT_TIMESTAMP` | Data da solicitação ou adição pelo admin |
| 6 | `aprovado_em` | `DATETIME` | - | Sim | - | NULL | Preenchido **apenas** quando `status = APROVADO` |

### 3.2 Restrições (Constraints)

| Nome | Tipo | Coluna(s) | Descrição |
|------|------|-----------|-----------|
| `PK_membro_organizacao` | PRIMARY KEY | `(organizacao_id, usuario_id)` | Um vínculo por usuário por organização |
| `FK_membro_org` | FOREIGN KEY | `organizacao_id` → `organizacao._id` | Organização deve existir (ON DELETE CASCADE lógico) |
| `FK_membro_usuario` | FOREIGN KEY | `usuario_id` → `usuario._id` | Usuário deve existir e estar ativo |
| `CK_membro_papel` | CHECK | `papel` | Valores: `ADMIN`, `MEMBRO` |
| `CK_membro_status` | CHECK | `status` | Valores: `PENDENTE`, `APROVADO`, `REJEITADO` |
| `CK_membro_aprovado_em` | CHECK | `aprovado_em` | `NOT NULL` SE `status = APROVADO`, `NULL` SE `status != APROVADO` |

### 3.3 Índices

| Nome | Coluna(s) | Tipo | Descrição |
|------|-----------|------|-----------|
| `IDX_membro_usuario` | `usuario_id` | NORMAL | Buscar organizações de um usuário |
| `IDX_membro_status` | `status` | NORMAL | Filtrar pendentes/aprovados/rejeitados |
| `IDX_membro_papel` | `papel` | NORMAL | Filtrar admins vs membros |

### 3.4 Regras de Negócio Associadas

| Código | Regra | Onde Validada |
|--------|-------|---------------|
| RN-15 | Solicitação só em org `APROVADA` | `adicionarMembro` → `exigirOrganizacaoAprovada` |
| RN-16 | Um vínculo por usuário por org | `adicionarMembro` → filtro `$ne` + `arrayFilters` |
| RN-17 | Novo vínculo = `MEMBRO` + `PENDENTE` | `adicionarMembro` (hardcoded) |
| RN-18 | Concorrência atômica | `updateOne` com `arrayFilters` |
| RN-22 | Gestão só por `ADMIN` aprovado na org | `exigirAdministrador` |
| RN-23 | Gestão só em org `APROVADA` | `exigirOrganizacaoAprovada` |
| RN-24 | Mostra `solicitado_em` na UI | Frontend `TelaMembrosOrganizacao` |
| RN-25 | Aprovação só por `ADMIN` da mesma org | `atualizarStatusMembro` + `arrayFilters` valida solicitante |
| RN-26 | Só `PENDENTE` pode ser aprovado | `atualizarStatusMembro` valida status atual |
| RN-27 | Operação atômica (race condition) | `updateOne` com `arrayFilters` + `modifiedCount === 1` |
| RN-28 | `aprovado_em` preenchido só na aprovação | `atualizarStatusMembro` → `$set aprovado_em` |
| RN-29 | Rejeição só por `ADMIN` da mesma org | Mesmo validador da aprovação |
| RN-30 | Rejeição remove `aprovado_em` | `$unset aprovado_em` |
| RN-31 | Rejeitado pode solicitar novamente | Novo vínculo `PENDENTE` (não reativa antigo) |
| RN-32 | Listagem: `ADMIN` primeiro, depois `MEMBRO`, ordenado por nome | Frontend `sort` em `TelaMembrosOrganizacao` |
| RN-33 | Não remover `ADMIN` da org | `removerMembro` → `ForbiddenException` se `papel=ADMIN` |
| RN-34 | Só remove `APROVADO` | `removerMembro` → `ConflictException` se status != `APROVADO` |
| RN-35 | Remoção cascata em comissões | `ComissaoModel.updateMany($pull membros.usuario_id)` |
| RN-36 | Conta do usuário preservada | Apenas vínculo removido (soft delete do vínculo) |

---

## 4. Relacionamentos (Chaves Estrangeiras)

### 4.1 `organizacao.criada_por` → `usuario._id`

| Atributo | Valor |
|----------|-------|
| **Tabela Origem** | `organizacao` |
| **Coluna Origem** | `criada_por` |
| **Tabela Destino** | `usuario` |
| **Coluna Destino** | `_id` |
| **Cardinalidade** | N:1 (N organizações para 1 usuário criador) |
| **Ação ON DELETE** | `RESTRICT` (não deleta usuário se tem orgs; org persiste) |
| **Ação ON UPDATE** | `CASCADE` (ObjectId imutável, não aplica) |
| **Validação** | `OrganizacoesService.criar` busca usuario + `NotFoundException` se não existe |
| **Regra Extra** | Usuário deve ser `ADMIN_SISTEMA` (`UsuarioComumGuard`) |

### 4.2 `membro_organizacao.usuario_id` → `usuario._id`

| Atributo | Valor |
|----------|-------|
| **Tabela Origem** | `membro_organizacao` (embutida) |
| **Coluna Origem** | `usuario_id` |
| **Tabela Destino** | `usuario` |
| **Coluna Destino** | `_id` |
| **Cardinalidade** | N:1 (N vínculos para 1 usuário) |
| **Ação ON DELETE** | `CASCADE` lógico (remoção do vínculo via `removerMembro`) |
| **Validação** | `adicionarMembro` / `atualizarStatusMembro` / `removerMembro` buscam usuário + `ativo: true` |
| **Regra Extra** | Usuário deve ter `ativo: true` |

### 4.3 `membro_organizacao.organizacao_id` → `organizacao._id` (Implícita - Pai do Array)

| Atributo | Valor |
|----------|-------|
| **Tabela Origem** | `membro_organizacao` (embutida) |
| **Coluna Origem** | (Pertence ao documento `organizacao`) |
| **Tabela Destino** | `organizacao` |
| **Coluna Destino** | `_id` |
| **Cardinalidade** | 1:N (1 organização para N membros) |
| **Ação ON DELETE** | `CASCADE` (array removido junto com documento pai) |
| **Regra Extra** | Operações só permitidas se `organizacao.status = APROVADA` (exceto criação) |

---

## 5. Matriz de Acesso por Perfil (CRUD por Tabela)

| Operação | `usuario` | `organizacao` | `membro_organizacao` |
|----------|-----------|---------------|---------------------|
| **CREATE** | Anônimo (cadastro) / `ADMIN_SISTEMA` | `ADMIN_SISTEMA` | `USUARIO` (solicita) / `ADMIN_ORG` (adiciona) |
| **READ (own)** | `USUARIO` (perfil) | `USUARIO` (suas orgs) | `USUARIO` (seus vínculos) |
| **READ (all)** | `ADMIN_SISTEMA` | `ADMIN_SISTEMA` | `ADMIN_ORG` (sua org) |
| **UPDATE (dados)** | `USUARIO` (próprio) / `ADMIN_SISTEMA` | `ADMIN_SISTEMA` | `ADMIN_ORG` (status vínculo) |
| **UPDATE (status org)** | - | `ADMIN_SISTEMA` (aprovar/revogar) | - |
| **DELETE** | `ADMIN_SISTEMA` (desativar) | `ADMIN_SISTEMA` (excluir se REVOGADA) | `ADMIN_ORG` (remover MEMBRO aprovado) |

---

## 6. Dicionário de Domínios (Enums)

### 6.1 `d_tipo_usuario`
| Código | Label | Descrição |
|--------|-------|-----------|
| `USUARIO` | Usuário Comum | Acesso padrão à plataforma |
| `ADMIN_SISTEMA` | Admin do Sistema | Gerencia organizações globais, não participa delas |

### 6.2 `d_tema_usuario`
| Código | Label | Descrição |
|--------|-------|-----------|
| `CLARO` | Claro | Força tema claro |
| `ESCURO` | Escuro | Força tema escuro |
| `SISTEMA` | Sistema | Segue preferência do SO (default) |

### 6.3 `d_status_organizacao`
| Código | Label | Permite Solicitações | Permite Gestão Membros | Próximos Estados |
|--------|-------|---------------------|------------------------|------------------|
| `PENDENTE` | Pendente | Não | Não | `APROVADA` |
| `APROVADA` | Aprovada | **Sim** | **Sim** | `REVOGADA` |
| `REVOGADA` | Revogada | Não | Não | `APROVADA` (reativar) / `EXCLUÍDA` |

### 6.4 `d_papel_organizacao`
| Código | Label | Permissões |
|--------|-------|------------|
| `ADMIN` | Administrador | Aprovar/rejeitar/remover membros, gerenciar comissões |
| `MEMBRO` | Membro | Participar de comissões, visualizar conteúdo |

### 6.5 `d_status_membro_organizacao`
| Código | Label | Descrição | Próximos Estados Válidos |
|--------|-------|-----------|-------------------------|
| `PENDENTE` | Pendente | Aguardando análise do admin da org | `APROVADO`, `REJEITADO` |
| `APROVADO` | Aprovado | Acesso liberado à organização | `REMOVIDO` (via remoção) |
| `REJEITADO` | Rejeitado | Acesso negado | Novo vínculo `PENDENTE` (nova solicitação) |

---

## 7. Mapeamento Físico MongoDB ↔ Lógico Relacional

| Conceito Lógico | Implementação Física (MongoDB/Mongoose) |
|-----------------|-----------------------------------------|
| Tabela `usuario` | Collection `usuarios` + `UsuarioSchema` |
| Tabela `organizacao` | Collection `organizacoes` + `OrganizacaoSchema` |
| Tabela `membro_organizacao` | Subdocument array `Organizacao.membros` + `MembroOrganizacaoSchema` (`_id: false`) |
| PK `_id` | `ObjectId` gerado pelo MongoDB (`_id` automático) |
| FK `criada_por` | `Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })` |
| FK `usuario_id` (membro) | `Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })` |
| UK `email` | `unique: true` + `lowercase: true` + `collation: { locale: 'pt', strength: 2 }` |
| UK `nome` (org) | `unique: true` + validação regex case-insensitive em `exigirNomeDisponivel` |
| PK Composta `(org_id, user_id)` | Garantida por lógica atômica no `adicionarMembro` (`$ne` + `arrayFilters`) |
| CHECK ENUMs | `enum: TipoUsuario` / `enum: StatusOrganizacao` etc. no `@Prop()` |
| Timestamps `criado_em` / `atualizado_em` | `timestamps: { createdAt: 'criado_em', updatedAt: 'atualizado_em' }` no `@Schema()` |
| Soft Delete `usuario.ativo` | `ativo: false` no `UsuarioService.remover` (não deleta doc) |
| Hard Delete `organizacao` | `deleteOne({ _id, status: REVOGADA })` + `deleteMany comissões` |
| JOIN / Populate | `.populate('criada_por')`, `.populate('membros.usuario_id')` |

---

## 8. Exemplos de Dados (Formato Relacional)

### 8.1 `usuario`
| _id | nome | email | senha_hash | tipo | tema | ativo | criado_em |
|-----|------|-------|------------|------|------|-------|-----------|
| `64f1a2b3c4d5e6f7g8h9i0j1` | João Silva | joao@empresa.com | `$2b$10$X7Y8Z9...` | USUARIO | SISTEMA | TRUE | 2024-09-01 10:30:00 |
| `64f1a2b3c4d5e6f7g8h9i0j2` | Maria Admin | admin@sistema.com | `$2b$10$AbCdEf...` | ADMIN_SISTEMA | ESCURO | TRUE | 2024-08-15 08:00:00 |

### 8.2 `organizacao`
| _id | nome | descricao | status | criada_por | criado_em |
|-----|------|-----------|--------|------------|-----------|
| `64f1a2b3c4d5e6f7g8h9i0j3` | Empresa Alpha | Org de exemplo | APROVADA | `64f1a2b3c4d5e6f7g8h9i0j2` | 2024-09-01 10:30:00 |
| `64f1a2b3c4d5e6f7g8h9i0j4` | Beta Corp | Nova org | PENDENTE | `64f1a2b3c4d5e6f7g8h9i0j2` | 2024-09-20 14:00:00 |

### 8.3 `membro_organizacao` (Linhas lógicas do array embutido da org `64f1a2b3c4d5e6f7g8h9i0j3`)
| organizacao_id | usuario_id | papel | status | solicitado_em | aprovado_em |
|----------------|------------|-------|--------|---------------|-------------|
| `64f1a2b3c4d5e6f7g8h9i0j3` | `64f1a2b3c4d5e6f7g8h9i0j2` | ADMIN | APROVADO | 2024-09-01 10:30:00 | 2024-09-01 10:30:00 |
| `64f1a2b3c4d5e6f7g8h9i0j3` | `64f1a2b3c4d5e6f7g8h9i0j1` | MEMBRO | PENDENTE | 2024-09-10 08:15:00 | NULL |
| `64f1a2b3c4d5e6f7g8h9i0j3` | `64f1a2b3c4d5e6f7g8h9i0j5` | MEMBRO | APROVADO | 2024-09-05 12:00:00 | 2024-09-05 14:30:00 |

---

## 9. Versionamento

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2024-09-24 | - | Versão inicial baseada no código-fonte (schemas, services, guards, DTOs) |

---

*Este dicionário representa a **visão relacional lógica** do modelo de dados NoSQL real (MongoDB). As constraints de integridade referencial e unicidade são garantidas pela **camada de aplicação** (NestJS Services + Guards + Mongoose validações) e por **operações atômicas** no MongoDB (`updateOne` com `arrayFilters`), não por constraints de banco de dados tradicionais.*