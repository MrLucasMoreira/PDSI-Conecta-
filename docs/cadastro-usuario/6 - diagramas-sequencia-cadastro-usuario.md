# Diagramas de Sequência - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Formato:** Mermaid (sequenceDiagram)  
> **Versão:** 1.0

---

## Índice de Diagramas

1. [Cadastro de Usuário](#1-cadastro-de-usuário)
2. [Login e Autenticação](#2-login-e-autenticação)
3. [Recuperação de Senha](#3-recuperação-de-senha)
4. [Criação de Organização (Admin Sistema)](#4-criação-de-organização-admin-sistema)
5. [Listagem de Organizações](#5-listagem-de-organizações)
6. [Solicitação de Acesso a Organização](#6-solicitação-de-acesso-a-organização)
7. [Aprovação de Solicitação (Admin Org)](#7-aprovação-de-solicitação-admin-org)
8. [Rejeição de Solicitação (Admin Org)](#8-rejeição-de-solicitação-admin-org)
9. [Remoção de Membro (Admin Org)](#9-remoção-de-membro-admin-org)
10. [Aprovação/Revogação/Exclusão de Organização (Admin Sistema)](#10-aprovaçãorevogaçãoexclusão-de-organização-admin-sistema)

---

## 1. Cadastro de Usuário

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB

    Usuario->>Frontend: Acessa tela /login/cadastro
    Frontend->>Usuario: Exibe formulário (nome, email, senha, confirmar)
    Usuario->>Frontend: Preenche dados e clica "Criar conta"
    
    Note over Frontend: Validação client-side<br/>(nome obrigatório, email válido,<br/>senha >= 8, confirmação igual)
    
    alt Dados inválidos
        Frontend->>Usuario: Exibe erros por campo
    else Dados válidos
        Frontend->>API: POST /usuarios<br/>{nome, email, senha}
        API->>API: Normaliza email (lowercase, trim)
        API->>DB: findOne({ email })
        alt Email já existe
            DB-->>API: Usuario existente
            API-->>Frontend: 409 Conflict "Já existe um usuário com este email"
            Frontend->>Usuario: Exibe erro
        else Email disponível
            API->>API: bcrypt.hash(senha, 10)
            API->>DB: insertOne({nome, email, senha_hash, tipo: USUARIO, tema: SISTEMA, ativo: true})
            DB-->>API: Usuario criado
            API-->>Frontend: 201 Created {usuario}
            Frontend->>Usuario: Sucesso + redireciona para /login
        end
    end
```

---

## 2. Login e Autenticação

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant SecureStore as SecureStore / LocalStorage

    Usuario->>Frontend: Acessa tela /login
    Frontend->>Usuario: Exibe formulário (email, senha)
    Usuario->>Frontend: Preenche credenciais e clica "Entrar"
    
    Note over Frontend: Validação client-side<br/>(email válido, senha não vazia)
    
    Frontend->>API: POST /auth/login<br/>{email, senha}
    API->>API: Normaliza email (lowercase, trim)
    API->>DB: findOne({ email }).select('+senha_hash +senhaHash')
    
    alt Usuário não encontrado
        DB-->>API: null
        API-->>Frontend: 401 Unauthorized "Email ou senha inválidos"
    else Usuário encontrado
        alt Conta desativada (ativo: false)
            API-->>Frontend: 401 Unauthorized "Usuário desativado"
        else Conta ativa
            API->>API: Obtém hash (senha_hash || senhaHash)
            alt Hash não existe (conta legada)
                API-->>Frontend: 400 BadRequest "Use recuperação de conta"
            else Hash existe
                API->>API: bcrypt.compare(senha, hash)
                alt Senha incorreta
                    API-->>Frontend: 401 Unauthorized "Email ou senha inválidos"
                else Senha correta
                    API->>API: jwtService.sign({sub, email, tipo})
                    API-->>Frontend: 200 OK {access_token, usuario: {id, nome, email, tipo, tema}}
                    Frontend->>SecureStore: Salva token
                    Frontend->>Frontend: Define tema se preferência
                    Frontend->>Usuario: Redireciona para /inicio
                end
            end
        end
    end
```

---

## 3. Recuperação de Senha

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Email as Servidor Email (Nodemailer)

    %% Solicitação
    Usuario->>Frontend: Clica "Esqueci minha senha"
    Frontend->>Usuario: Tela /login/recuperar-conta (campo email)
    Usuario->>Frontend: Informa email e envia
    Frontend->>API: POST /auth/recuperar-conta<br/>{email}
    API->>API: Normaliza email
    API->>DB: findOne({ email, ativo: true })
    
    alt Usuário não encontrado ou inativo
        DB-->>API: null
        Note over API: Retorna sucesso genérico<br/>(prevenção de enumeração)
        API-->>Frontend: 200 OK {mensagem: "Se existir conta ativa..."}
    else Usuário encontrado
        DB-->>API: Usuario
        API->>API: Gera token aleatório (32 bytes hex)
        API->>API: Hash SHA-256 do token
        API->>DB: updateOne({_id}, {reset_senha_token_hash, reset_senha_expira_em: now+30min})
        API->>Email: Envia email com link APP_RESET_URL?token=<token>
        API-->>Frontend: 200 OK {mensagem: "Se existir conta ativa..."}
    end
    Frontend->>Usuario: Exibe mensagem de sucesso

    %% Redefinição
    Usuario->>Frontend: Clica link no email → /login/redefinir-senha?token=...
    Frontend->>Usuario: Tela redefinir senha (nova senha, confirmar)
    Usuario->>Frontend: Preenche e envia
    Frontend->>API: POST /auth/redefinir-senha<br/>{token, nova_senha}
    API->>API: Hash SHA-256 do token recebido
    API->>DB: findOne({reset_senha_token_hash: hash, reset_senha_expira_em: {$gt: now}, ativo: true})
    
    alt Token inválido/expirado
        DB-->>API: null
        API-->>Frontend: 400 BadRequest "Link inválido ou expirou"
    else Token válido
        DB-->>API: Usuario
        API->>API: bcrypt.hash(nova_senha, 10)
        API->>DB: updateOne({_id}, {senha_hash: novoHash, $unset: {reset_senha_token_hash, reset_senha_expira_em}})
        API-->>Frontend: 200 OK {mensagem: "Senha redefinida com sucesso"}
        Frontend->>Usuario: Sucesso + redireciona para /login
    end
```

---

## 4. Criação de Organização (Admin Sistema)

```mermaid
sequenceDiagram
    autonumber
    actor AdminSistema as Admin do Sistema
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Guards as Guards (NestJS)

    AdminSistema->>Frontend: Acessa /organizacoes/aprovacao
    Frontend->>API: GET /usuarios/me (valida sessão)
    API->>Guards: JwtAuthGuard + AdminSistemaGuard
    Guards-->>API: Autorizado (tipo === ADMIN_SISTEMA)
    API->>DB: findById(userId)
    DB-->>API: Usuario (ADMIN_SISTEMA)
    API-->>Frontend: 200 OK {usuario}
    Frontend->>AdminSistema: Exibe tela "Gerenciar organizações"
    
    AdminSistema->>Frontend: Clica "Nova organização" / preenche nome, descrição
    Frontend->>API: POST /organizacoes<br/>{nome, descricao?}
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
    Guards-->>API: Autorizado (não é ADMIN_SISTEMA? Não - wait)
    
    Note right of Guards: UsuarioComumGuard BLOQUEIA ADMIN_SISTEMA<br/>Criação de org é para USUARIO COMUM apenas!
    
    alt Bloqueado por Guard
        API-->>Frontend: 403 Forbidden "O administrador do sistema não pode realizar esta operação"
    else Fluxo correto: Usuário Comum cria org
        Actor UsuarioComum as Usuário Comum
        UsuarioComum->>Frontend: Acessa /organizacoes/cadastro
        Frontend->>API: POST /organizacoes<br/>{nome, descricao?}
        API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
        Guards-->>API: Autorizado (tipo === USUARIO)
        API->>DB: findById(userId)
        DB-->>API: Usuario
        API->>DB: Verifica nome único (regex case-insensitive)
        alt Nome duplicado
            API-->>Frontend: 409 Conflict "Já existe uma organização com este nome"
        else Nome disponível
            API->>DB: insertOne Organizacao<br/>{nome, descricao, status: PENDENTE, criada_por: userId,<br/>membros: [{usuario_id: userId, papel: ADMIN, status: APROVADO, solicitado_em: now, aprovado_em: now}]}
            DB-->>API: Organizacao criada
            API-->>Frontend: 201 Created {organizacao}
            Frontend->>UsuarioComum: Sucesso + redireciona
        end
    end
```

---

## 5. Listagem de Organizações

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário Autenticado
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Guards as Guards

    Usuario->>Frontend: Acessa /organizacoes/participar
    Frontend->>API: GET /organizacoes (com token JWT)
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard
    Guards-->>API: OK (usuario autenticado e ativo)
    API->>DB: Busca organizações
    
    alt Usuario é ADMIN_SISTEMA
        API->>DB: find().populate('criada_por').sort({criado_em: -1})
    else Usuario Comum
        API->>DB: find({$or: [{status: APROVADA}, {'membros.usuario_id': userId}]}).select('nome descricao status membros')
    end
    
    DB-->>API: Lista de organizações
    API->>API: Mapeia para incluir meu_vinculo (papel, status)
    API-->>Frontend: 200 OK [Organizacao[]]
    Frontend->>Frontend: Separa em abas: Disponíveis, Pendentes, Recusadas
    Frontend->>Usuario: Exibe lista organizada
```

---

## 6. Solicitação de Acesso a Organização

```mermaid
sequenceDiagram
    autonumber
    actor Usuario as Usuário Comum
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Guards as Guards

    Usuario->>Frontend: Na aba "Disponíveis", clica "Pedir para participar"
    Frontend->>API: POST /organizacoes/:id/membros<br/>{} (body vazio, userId no token)
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
    Guards-->>API: Autorizado
    API->>DB: findById(orgId)
    
    alt Org não existe
        DB-->>API: null
        API-->>Frontend: 404 NotFound "Organização não encontrada"
    else Org existe
        alt Org não está APROVADA
            API-->>Frontend: 403 Forbidden "Organização não está aprovada para receber solicitações"
        else Org APROVADA
            API->>DB: findById(userId) - valida usuário ativo
            alt Usuário não encontrado/inativo
                API-->>Frontend: 404 NotFound "Usuário não encontrado"
            else Usuário OK
                API->>API: Verifica se já tem vínculo (membros.some)
                alt Já tem vínculo
                    API-->>Frontend: 409 Conflict "Usuário já pertence ou possui solicitação"
                else Sem vínculo
                    API->>DB: updateOne<br/>{_id: orgId, status: APROVADA, 'membros.usuario_id': {$ne: userId}}<br/>$push: {membros: {usuario_id: userId, papel: MEMBRO, status: PENDENTE, solicitado_em: now}}
                    alt modifiedCount !== 1 (concorrência)
                        API-->>Frontend: 409 Conflict "Solicitação já registrada ou organização indisponível"
                    else Sucesso
                        DB-->>API: WriteResult
                        API-->>Frontend: 200 OK {mensagem: "Solicitação enviada para análise", membro}
                        Frontend->>Frontend: Move org para aba "Pendentes"
                        Frontend->>Usuario: Exibe sucesso "Admin vai analisar"
                    end
                end
            end
        end
    end
```

---

## 7. Aprovação de Solicitação (Admin Org)

```mermaid
sequenceDiagram
    autonumber
    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Guards as Guards

    AdminOrg->>Frontend: Acessa /organizacoes/membros?organizacao_id=...
    Frontend->>API: GET /organizacoes (lista orgs onde é ADMIN aprovado)
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard
    Guards-->>API: OK
    API->>DB: find({status: APROVADA, 'membros.usuario_id': userId, 'membros.papel': ADMIN, 'membros.status': APROVADO})
    DB-->>API: Orgs administradas
    Frontend->>AdminOrg: Lista orgs para escolher
    
    AdminOrg->>Frontend: Seleciona org → carrega detalhes
    Frontend->>API: GET /organizacoes/:id
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard
    API->>API: exigirAdministrador(orgId, solicitanteId)
    API->>DB: findById(orgId).populate('membros.usuario_id')
    DB-->>API: Organizacao com membros populados
    API-->>Frontend: 200 OK {organizacao, membros[]}
    Frontend->>AdminOrg: Exibe seção "Solicitações pendentes" com botões Aprovar/Rejeitar
    
    AdminOrg->>Frontend: Clica "Aprovar" em membro PENDENTE
    Frontend->>API: PATCH /organizacoes/:id/membros/:usuarioId<br/>{status: "APROVADO"}
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
    Guards-->>API: OK
    API->>API: exigirAdministrador(orgId, solicitanteId)
    API->>API: exigirOrganizacaoAprovada(organizacao)
    API->>API: Valida status alvo === PENDENTE
    API->>API: Valida statusDto === APROVADO ou REJEITADO
    
    alt Validações falham
        API-->>Frontend: 400/403/409 erro correspondente
    else Validações OK
        API->>DB: updateOne<br/>{_id: orgId, status: APROVADA,<br/>$and: [{membros: {$elemMatch: {usuario_id: solicitanteId, papel: ADMIN, status: APROVADO}}},<br/>{membros: {$elemMatch: {usuario_id: alvoId, status: PENDENTE}}}]},
        {$set: {'membros.$[alvo].status': 'APROVADO', 'membros.$[alvo].aprovado_em': now},<br/>arrayFilters: [{'alvo.usuario_id': alvoId, 'alvo.status': 'PENDENTE'}]}
        
        alt modifiedCount !== 1
            API-->>Frontend: 409 Conflict "Solicitação ou permissões alteradas. Atualize a lista"
        else Sucesso
            DB-->>API: WriteResult
            API-->>Frontend: 200 OK {mensagem: "Solicitação analisada", usuario_id, status: APROVADO}
            Frontend->>Frontend: Move membro para "Membros aprovados", etiqueta "Aprovado"
            Frontend->>AdminOrg: Feedback visual sucesso
        end
    end
```

---

## 8. Rejeição de Solicitação (Admin Org)

```mermaid
sequenceDiagram
    autonumber
    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant Guards as Guards

    AdminOrg->>Frontend: Na tela de membros, clica "Rejeitar" em solicitação PENDENTE
    Frontend->>API: PATCH /organizacoes/:id/membros/:usuarioId<br/>{status: "REJEITADO"}
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
    Guards-->>API: OK
    API->>API: exigirAdministrador(orgId, solicitanteId)
    API->>API: exigirOrganizacaoAprovada(organizacao)
    API->>API: Valida status alvo === PENDENTE
    API->>API: Valida statusDto === REJEITADO
    
    alt Validações falham
        API-->>Frontend: 400/403/409 erro
    else Validações OK
        API->>DB: updateOne<br/>{_id: orgId, status: APROVADA,<br/>$and: [{membros: {$elemMatch: {usuario_id: solicitanteId, papel: ADMIN, status: APROVADO}}},<br/>{membros: {$elemMatch: {usuario_id: alvoId, status: PENDENTE}}}]},
        {$set: {'membros.$[alvo].status': 'REJEITADO'},<br/>$unset: {'membros.$[alvo].aprovado_em': ''},<br/>arrayFilters: [{'alvo.usuario_id': alvoId, 'alvo.status': 'PENDENTE'}]}
        
        alt modifiedCount !== 1
            API-->>Frontend: 409 Conflict "Solicitação ou permissões alteradas"
        else Sucesso
            DB-->>API: WriteResult
            API-->>Frontend: 200 OK {mensagem: "Solicitação analisada", usuario_id, status: REJEITADO}
            Frontend->>Frontend: Move membro para aba "Recusadas", etiqueta "Solicitação recusada"
            Frontend->>AdminOrg: Feedback visual sucesso
        end
    end
```

---

## 9. Remoção de Membro (Admin Org)

```mermaid
sequenceDiagram
    autonumber
    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant ComissaoDB as MongoDB (Comissões)

    AdminOrg->>Frontend: Na seção "Membros aprovados", clica "Remover acesso" em MEMBRO
    Frontend->>Frontend: Abre Confirmacao modal com aviso
    Note over Frontend: "A pessoa também sairá das comissões.<br/>Conta e vínculos com outras orgs preservados."
    AdminOrg->>Frontend: Confirma remoção
    Frontend->>API: DELETE /organizacoes/:id/membros/:usuarioId
    API->>Guards: JwtAuthGuard + UsuarioAtivoGuard + UsuarioComumGuard
    Guards-->>API: OK
    API->>API: exigirAdministrador(orgId, solicitanteId)
    API->>API: exigirOrganizacaoAprovada(organizacao)
    API->>API: Busca membro alvo
    
    alt Membro é ADMIN
        API-->>Frontend: 403 Forbidden "Não é permitido remover administradores"
    else Membro não é APROVADO
        API-->>Frontend: 409 Conflict "Apenas membros aprovados podem ser removidos"
    else Membro é MEMBRO APROVADO
        API->>DB: updateOne<br/>{_id: orgId, status: APROVADA,<br/>$and: [{membros: {$elemMatch: {usuario_id: solicitanteId, papel: ADMIN, status: APROVADO}}},<br/>{membros: {$elemMatch: {usuario_id: alvoId, papel: MEMBRO, status: APROVADO}}}]},
        {$pull: {membros: {usuario_id: alvoId}}}
        
        alt modifiedCount !== 1
            API-->>Frontend: 409 Conflict "Vínculo ou permissões mudaram"
        else Sucesso remoção da org
            DB-->>API: WriteResult
            API->>ComissaoDB: updateMany<br/>{organizacao_id: orgId},<br/>{$pull: {membros: {usuario_id: alvoId}}}
            ComissaoDB-->>API: WriteResult
            API-->>Frontend: 200 OK {mensagem: "Acesso à organização removido com sucesso"}
            Frontend->>Frontend: Remove card da lista
            Frontend->>AdminOrg: Exibe sucesso "Acesso removido"
        end
    end
```

---

## 10. Aprovação/Revogação/Exclusão de Organização (Admin Sistema)

```mermaid
sequenceDiagram
    autonumber
    actor AdminSistema as Admin do Sistema
    participant Frontend as Frontend (React Native)
    participant API as Backend API (NestJS)
    participant DB as MongoDB
    participant ComissaoDB as MongoDB (Comissões)
    participant Guards as Guards

    AdminSistema->>Frontend: Acessa /organizacoes/aprovacao
    Frontend->>API: GET /usuarios/me + GET /organizacoes
    API->>Guards: JwtAuthGuard + AdminSistemaGuard (para GET /organizacoes como admin)
    Guards-->>API: OK (tipo === ADMIN_SISTEMA)
    API->>DB: find().populate('criada_por').sort({criado_em: -1})
    DB-->>API: Todas orgs (PENDENTE, APROVADA, REVOGADA)
    API-->>Frontend: 200 OK [Organizacao[]]
    Frontend->>AdminSistema: Exibe cards ordenados: Pendentes → Aprovadas → Revogadas

    %% Aprovar Organização
    AdminSistema->>Frontend: Em org PENDENTE, clica "Autorizar"
    Frontend->>API: PATCH /organizacoes/:id<br/>{status: "APROVADA"}
    API->>Guards: JwtAuthGuard + AdminSistemaGuard
    Guards-->>API: OK
    API->>DB: findByIdAndUpdate(id, {status: APROVADA}, {new: true}).populate(...)
    DB-->>API: Organizacao atualizada
    API-->>Frontend: 200 OK {organizacao}
    Frontend->>Frontend: Atualiza etiqueta para "Aprovada" (verde), mostra botão "Revogar"

    %% Revogar Organização
    AdminSistema->>Frontend: Em org APROVADA, clica "Revogar"
    Frontend->>API: PATCH /organizacoes/:id<br/>{status: "REVOGADA"}
    API->>Guards: JwtAuthGuard + AdminSistemaGuard
    Guards-->>API: OK
    API->>DB: findByIdAndUpdate(id, {status: REVOGADA}, {new: true}).populate(...)
    DB-->>API: Organizacao atualizada
    API-->>Frontend: 200 OK {organizacao}
    Frontend->>Frontend: Atualiza etiqueta para "Revogada" (vermelho), mostra botão "Excluir"

    %% Excluir Organização
    AdminSistema->>Frontend: Em org REVOGADA, clica "Excluir"
    Frontend->>Frontend: Abre Confirmacao: "Excluir [nome]? A organização e comissões serão apagadas de vez."
    AdminSistema->>Frontend: Confirma
    Frontend->>API: DELETE /organizacoes/:id
    API->>Guards: JwtAuthGuard + AdminSistemaGuard
    Guards-->>API: OK
    API->>DB: deleteOne({_id: id, status: REVOGADA})
    
    alt deletedCount !== 1
        API-->>Frontend: 409 Conflict "Revogue a organização antes de excluí-la"
    else Sucesso
        DB-->>API: WriteResult
        API->>ComissaoDB: deleteMany({organizacao_id: id})
        ComissaoDB-->>API: WriteResult
        API-->>Frontend: 200 OK {mensagem: "Organização excluída com sucesso"}
        Frontend->>Frontend: Remove card da lista
        Frontend->>AdminSistema: Feedback visual sucesso
    end
```

---

## Resumo de Endpoints e Guards

| Fluxo | Método | Endpoint | Guards | Service Method |
|-------|--------|----------|--------|----------------|
| Cadastro | POST | `/usuarios` | - | `UsuarioService.criar` |
| Login | POST | `/auth/login` | - | `AuthService.login` |
| Recuperar senha | POST | `/auth/recuperar-conta` | - | `AuthService.solicitarRecuperacao` |
| Redefinir senha | POST | `/auth/redefinir-senha` | - | `AuthService.redefinirSenha` |
| Criar org | POST | `/organizacoes` | JwtAuthGuard, UsuarioAtivoGuard, **UsuarioComumGuard** | `OrganizacoesService.criar` |
| Listar orgs | GET | `/organizacoes` | JwtAuthGuard, UsuarioAtivoGuard | `OrganizacoesService.listar` |
| Detalhes org | GET | `/organizacoes/:id` | JwtAuthGuard, UsuarioAtivoGuard | `OrganizacoesService.buscarPorId` (exige admin) |
| Solicitar acesso | POST | `/organizacoes/:id/membros` | JwtAuthGuard, UsuarioAtivoGuard, **UsuarioComumGuard** | `OrganizacoesService.adicionarMembro` |
| Aprovar/Rejeitar | PATCH | `/organizacoes/:id/membros/:usuarioId` | JwtAuthGuard, UsuarioAtivoGuard, **UsuarioComumGuard** | `OrganizacoesService.atualizarStatusMembro` (exige admin da org) |
| Remover membro | DELETE | `/organizacoes/:id/membros/:usuarioId` | JwtAuthGuard, UsuarioAtivoGuard, **UsuarioComumGuard** | `OrganizacoesService.removerMembro` (exige admin da org) |
| Atualizar org | PATCH | `/organizacoes/:id` | JwtAuthGuard, **AdminSistemaGuard** | `OrganizacoesService.atualizar` |
| Excluir org | DELETE | `/organizacoes/:id` | JwtAuthGuard, **AdminSistemaGuard** | `OrganizacoesService.remover` |

---

## Legenda de Cores (para referência visual)

| Cor | Significado |
|-----|-------------|
| 🟢 Verde | Sucesso / Fluxo principal |
| 🔴 Vermelho | Erro / Bloqueio / Exceção |
| 🟡 Amarelo | Validação / Decisão / Alternativa |
| 🔵 Azul | Operação de banco de dados |
| 🟣 Roxo | Guards / Autorização |
| ⚪ Cinza | Notas / Comentários |

---

*Diagramas gerados a partir da análise do código-fonte: Controllers, Services, Guards, Schemas e Frontend (React Native/Expo Router).*