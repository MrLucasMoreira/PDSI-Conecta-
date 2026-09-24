# Especificação de Requisitos Funcionais - Cadastro e Gestão de Usuários

---

## Sumário de Casos de Uso

| Código | Caso de Uso | Ator Principal |
|--------|-------------|----------------|
| RF-01 | Cadastrar-se na plataforma | Usuário Não Autenticado |
| RF-02 | Fazer login | Usuário Não Autenticado / Usuário Comum |
| RF-03 | Recuperar senha | Usuário Não Autenticado |
| RF-04 | Visualizar organizações aprovadas | Usuário Comum |
| RF-05 | Solicitar acesso a organização | Usuário Comum |
| RF-06 | Acompanhar status da solicitação | Usuário Comum |
| RF-07 | Visualizar solicitações pendentes | Admin da Organização |
| RF-08 | Aprovar solicitação de acesso | Admin da Organização |
| RF-09 | Rejeitar solicitação de acesso | Admin da Organização |
| RF-10 | Visualizar membros aprovados | Admin da Organização |
| RF-11 | Remover membro da organização | Admin da Organização |
| RF-12 | Criar organização | Admin do Sistema |
| RF-13 | Listar todas as organizações | Admin do Sistema |
| RF-14 | Aprovar organização | Admin do Sistema |
| RF-15 | Revogar organização | Admin do Sistema |
| RF-16 | Excluir organização | Admin do Sistema |

---

## Formulário Padrão de Requisito Funcional

---

### RF-01: Cadastrar-se na plataforma

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-01 |
| **Nome** | Cadastrar-se na plataforma |
| **Ator Principal** | Usuário Não Autenticado |
| **Atores Secundários** | Sistema |
| **Descrição** | Permite que um novo usuário crie uma conta na plataforma informando dados pessoais e credenciais de acesso. |
| **Pré-condições** | - Usuário não possui conta na plataforma<br>- Email informado não está cadastrado |
| **Pós-condições** | - Conta de usuário criada com tipo `USUARIO`<br>- Usuário redirecionado para tela de login<br>- Senha armazenada com hash bcrypt |
| **Fluxo Principal** | 1. Usuário acessa a tela de cadastro<br>2. Sistema exibe formulário com campos: nome, email, senha, confirmar senha<br>3. Usuário preenche os dados e submete<br>4. Sistema valida: nome obrigatório, email único e formato válido, senha com mínimo 8 caracteres, confirmação igual à senha<br>5. Sistema cria usuário com `tipo: USUARIO`, `ativo: true`, `tema: SISTEMA`<br>6. Sistema retorna sucesso e redireciona para login |
| **Fluxos Alternativos** | **FA-01: Email já cadastrado**<br>1. Sistema detecta email duplicado<br>2. Sistema retorna erro "Já existe um usuário com este email"<br>3. Usuário corrige e reenvia<br><br>**FA-02: Dados inválidos**<br>1. Sistema valida campos e encontra erros<br>2. Sistema exibe mensagens de erro por campo<br>3. Usuário corrige e reenvia |
| **Regras de Negócio** | - RN-01: Email deve ser único no sistema (case-insensitive)<br>- RN-02: Senha deve ter no mínimo 8 caracteres<br>- RN-03: Usuário criado por padrão com tipo `USUARIO` (não admin)<br>- RN-04: Senha armazenada com hash bcrypt (cost 10) |
| **Requisitos Não Funcionais** | - RNF-01: Resposta em < 2s<br>- RNF-02: Comunicação via HTTPS<br>- RNF-03: Validação client-side e server-side |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC1 - Caso de uso "Cadastrar-se na plataforma" |

---

### RF-02: Fazer login

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-02 |
| **Nome** | Fazer login |
| **Ator Principal** | Usuário Não Autenticado / Usuário Comum |
| **Atores Secundários** | Sistema |
| **Descrição** | Autentica usuário na plataforma e retorna token JWT para sessão. |
| **Pré-condições** | - Usuário possui conta ativa (`ativo: true`)<br>- Credenciais corretas |
| **Pós-condições** | - Token JWT gerado com claims: `sub` (userId), `email`, `tipo`<br>- Token armazenado no cliente (SecureStore/localStorage)<br>- Usuário redirecionado para tela inicial |
| **Fluxo Principal** | 1. Usuário acessa tela de login<br>2. Sistema exibe campos: email, senha<br>3. Usuário informa credenciais e submete<br>4. Sistema busca usuário por email<br>5. Sistema verifica se conta está ativa<br>6. Sistema compara hash da senha com bcrypt<br>7. Sistema gera JWT assinado<br>8. Sistema retorna token + dados do usuário (nome, email, tipo, tema)<br>9. Cliente armazena token e redireciona para `/inicio` |
| **Fluxos Alternativos** | **FA-01: Credenciais inválidas**<br>1. Email não encontrado ou senha incorreta<br>2. Sistema retorna erro genérico "Email ou senha inválidos"<br>3. Usuário tenta novamente<br><br>**FA-02: Conta desativada**<br>1. Usuário encontrado mas `ativo: false`<br>2. Sistema retorna erro "Usuário desativado"<br><br>**FA-03: Senha não definida (conta legada)**<br>1. Sistema detecta `senha_hash` nulo<br>2. Sistema retorna erro orientando para recuperação de conta |
| **Regras de Negócio** | - RN-05: Token JWT expira conforme configuração (ex: 24h)<br>- RN-06: Token inclui `tipo` atualizado do banco (permite mudança de role sem relogin)<br>- RN-07: Email normalizado para lowercase no login |
| **Requisitos Não Funcionais** | - RNF-04: Rate limiting para evitar brute force<br>- RNF-05: Senha nunca logada<br>- RNF-06: Token assinado com RS256 ou HS256 seguro |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC2 - Caso de uso "Fazer login" |

---

### RF-03: Recuperar senha

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-03 |
| **Nome** | Recuperar senha |
| **Ator Principal** | Usuário Não Autenticado |
| **Atores Secundários** | Sistema, Servidor de Email |
| **Descrição** | Permite que usuário solicite redefinição de senha via email com link temporário. |
| **Pré-condições** | - Usuário possui conta ativa com o email informado |
| **Pós-condições** | - Token de recuperação gerado (hash SHA-256 armazenado)<br>- Link de redefinição enviado por email<br>- Token expira em 30 minutos |
| **Fluxo Principal** | 1. Usuário acessa "Esqueci minha senha"<br>2. Sistema solicita email<br>3. Usuário informa email e submete<br>4. Sistema busca usuário ativo por email<br>5. Sistema gera token aleatório (32 bytes hex)<br>6. Sistema armazena `reset_senha_token_hash` (SHA-256) e `reset_senha_expira_em` (30 min)<br>7. Sistema envia email com link: `APP_RESET_URL?token=<token>`<br>8. Sistema retorna mensagem genérica de sucesso (mesmo se email não existir) |
| **Fluxos Alternativos** | **FA-01: Email não cadastrado**<br>1. Sistema não encontra usuário<br>2. Sistema retorna mesma mensagem de sucesso (prevenção de enumeração)<br><br>**FA-02: SMTP não configurado (dev)**<br>1. Sistema loga link no console para testes |
| **Regras de Negócio** | - RN-08: Token de uso único (invalidado após uso)<br>- RN-09: Token expira em 30 minutos<br>- RN-10: Mensagem genérica evita enumeração de emails<br>- RN-11: Nova senha deve ser diferente da atual |
| **Requisitos Não Funcionais** | - RNF-07: Email enviado em < 5s<br>- RNF-08: Link HTTPS em produção |
| **Prioridade** | Média |
| **Rastreabilidade** | UC3 - Caso de uso "Recuperar senha" |

---

### RF-04: Visualizar organizações aprovadas

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-04 |
| **Nome** | Visualizar organizações aprovadas |
| **Ator Principal** | Usuário Comum |
| **Atores Secundários** | Sistema |
| **Descrição** | Lista organizações com status `APROVADA` onde o usuário pode solicitar acesso, além das que já possui vínculo (pendente/rejeitado). |
| **Pré-condições** | - Usuário autenticado (JWT válido)<br>- Usuário com `ativo: true` |
| **Pós-condições** | - Lista de organizações retornada com status do vínculo do usuário |
| **Fluxo Principal** | 1. Usuário acessa tela "Participar de organização"<br>2. Sistema faz `GET /organizacoes` com token<br>3. Backend filtra: `status = APROVADA` OU usuário tem vínculo na org<br>4. Sistema retorna: `_id`, `nome`, `descricao`, `status`, `meu_vinculo` (papel, status)<br>5. Frontend separa em abas: Disponíveis, Pendentes, Recusadas |
| **Fluxos Alternativos** | **FA-01: Nenhuma organização**<br>1. Lista vazia<br>2. Frontend exibe estado vazio por aba |
| **Regras de Negócio** | - RN-12: Admin do sistema vê todas as orgs (qualquer status)<br>- RN-13: Usuário comum vê apenas APROVADAS + suas solicitações<br>- RN-14: Org PENDENTE/REVOGADA sem vínculo não aparece |
| **Requisitos Não Funcionais** | - RNF-09: Paginação se > 50 orgs (futuro) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC4 - Caso de uso "Visualizar organizações aprovadas" |

---

### RF-05: Solicitar acesso a organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-05 |
| **Nome** | Solicitar acesso a organização |
| **Ator Principal** | Usuário Comum |
| **Atores Secundários** | Sistema, Admin da Organização (notificado indiretamente) |
| **Descrição** | Usuário solicita ingresso em uma organização aprovada; cria vínculo `PENDENTE` com papel `MEMBRO`. |
| **Pré-condições** | - Usuário autenticado e ativo<br>- Organização existe e `status: APROVADA`<br>- Usuário não possui vínculo (nenhum status) nessa organização |
| **Pós-condições** | - Vínculo criado: `papel: MEMBRO`, `status: PENDENTE`, `solicitado_em: now`<br>- Solicitação aparece para admins da org na aba "Pendentes" |
| **Fluxo Principal** | 1. Usuário visualiza organizações disponíveis (aba "Disponíveis")<br>2. Usuário clica "Pedir para participar"<br>3. Sistema faz `POST /organizacoes/:id/membros` com userId do token<br>4. Backend valida: org existe, status APROVADA, usuário ativo, sem vínculo prévio<br>5. Backend cria vínculo com `$push` atomic (evita duplicidade concorrente)<br>6. Sistema retorna sucesso + vínculo criado<br>7. Frontend move org para aba "Pendentes" com etiqueta "Solicitação pendente" |
| **Fluxos Alternativos** | **FA-01: Organização não aprovada**<br>1. Backend retorna 403 "Organização não está aprovada"<br><br>**FA-02: Usuário já tem vínculo**<br>1. Backend retorna 409 "Usuário já pertence ou possui solicitação"<br><br>**FA-03: Organização não encontrada**<br>1. Backend retorna 404 |
| **Regras de Negócio** | - RN-15: Apenas orgs `APROVADA` aceitam solicitações<br>- RN-16: Um usuário só pode ter um vínculo por organização<br>- RN-17: Novo vínculo sempre inicia como `MEMBRO` + `PENDENTE`<br>- RN-18: Concorrência tratada com `updateOne` + filtro `$ne` |
| **Requisitos Não Funcionais** | - RNF-10: Feedback visual imediato no frontend |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC5 - Caso de uso "Solicitar acesso a organização" |

---

### RF-06: Acompanhar status da solicitação

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-06 |
| **Nome** | Acompanhar status da solicitação |
| **Ator Principal** | Usuário Comum |
| **Atores Secundários** | Sistema |
| **Descrição** | Usuário visualiza o status de suas solicitações de acesso (pendente, aprovado, rejeitado) por organização. |
| **Pré-condições** | - Usuário autenticado<br>- Usuário possui ao menos um vínculo com status `PENDENTE` ou `REJEITADO` |
| **Pós-condições** | - Status atualizado exibido na interface |
| **Fluxo Principal** | 1. Usuário acessa tela "Participar de organização"<br>2. Sistema carrega organizações (RF-04)<br>3. Usuário alterna para aba "Pendentes" ou "Recusadas"<br>4. Frontend filtra por `meu_vinculo.status`<br>5. Exibe etiqueta: "Solicitação pendente" (alerta) ou "Solicitação recusada" (erro) |
| **Fluxos Alternativos** | **FA-01: Solicitação aprovada**<br>1. Org não aparece mais nas abas Pendentes/Recusadas<br>2. Usuário passa a ter acesso às funcionalidades da org |
| **Regras de Negócio** | - RN-19: Status `PENDENTE` → pode ser aprovado/rejeitado por admin<br>- RN-20: Status `REJEITADO` → usuário pode solicitar novamente (novo vínculo)<br>- RN-21: Status `APROVADO` → org some das abas de solicitação |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC6 - Caso de uso "Acompanhar status da solicitação" |

---

### RF-07: Visualizar solicitações pendentes

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-07 |
| **Nome** | Visualizar solicitações pendentes |
| **Ator Principal** | Admin da Organização |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin da organização visualiza lista de usuários com solicitação de acesso pendente de análise. |
| **Pré-condições** | - Usuário autenticado<br>- Usuário é `ADMIN` com `status: APROVADO` na organização<br>- Organização `status: APROVADA` |
| **Pós-condições** | - Lista de membros pendentes exibida com dados: nome, email, papel, data da solicitação |
| **Fluxo Principal** | 1. Admin acessa tela "Membros da organização" (rota `/organizacoes/membros?organizacao_id=...`)<br>2. Sistema lista organizações onde usuário é ADMIN aprovado<br>3. Admin seleciona uma organização<br>4. Sistema faz `GET /organizacoes/:id` com populate de membros<br>5. Backend valida: solicitante é ADMIN aprovado na org (`exigirAdministrador`)<br>6. Frontend filtra `membros.status === PENDENTE`<br>7. Exibe cards com: avatar, nome, email, papel (MEMBRO), etiqueta "Pendente", botões Aprovar/Rejeitar |
| **Fluxos Alternativos** | **FA-01: Admin não tem orgs administradas**<br>1. Frontend exibe estado vazio "Você ainda não administra uma organização aprovada"<br><br>**FA-02: Nenhuma solicitação pendente**<br>1. Frontend exibe "Não há solicitações pendentes" |
| **Regras de Negócio** | - RN-22: Apenas ADMIN com status APROVADO na org pode visualizar<br>- RN-23: Org deve estar APROVADA<br>- RN-24: Mostra data da solicitação (`solicitado_em`) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC7 - Caso de uso "Visualizar solicitações pendentes" |

---

### RF-08: Aprovar solicitação de acesso

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-08 |
| **Nome** | Aprovar solicitação de acesso |
| **Ator Principal** | Admin da Organização |
| **Atores Secundários** | Sistema, Usuário Solicitante |
| **Descrição** | Admin aprova solicitação de acesso, alterando status do vínculo para `APROVADO` e registrando data de aprovação. |
| **Pré-condições** | - Admin autenticado, ADMIN aprovado na org<br>- Organização APROVADA<br>- Solicitação existe com status `PENDENTE` |
| **Pós-condições** | - Vínculo atualizado: `status: APROVADO`, `aprovado_em: now`<br>- Usuário ganha acesso às comissões e recursos da organização |
| **Fluxo Principal** | 1. Admin visualiza solicitações pendentes (RF-07)<br>2. Admin clica "Aprovar" no card do usuário<br>3. Sistema faz `PATCH /organizacoes/:id/membros/:usuarioId` com `{ status: "APROVADO" }`<br>4. Backend valida: solicitante é ADMIN aprovado, org APROVADA, alvo está PENDENTE<br>5. Backend faz `updateOne` com `arrayFilters` atômico:<br>   - `$set: { 'membros.$[alvo].status': 'APROVADO', 'membros.$[alvo].aprovado_em': now }`<br>6. Sistema retorna sucesso<br>7. Frontend atualiza: move usuário para seção "Membros aprovados", etiqueta "Aprovado" (sucesso) |
| **Fluxos Alternativos** | **FA-01: Solicitação já processada**<br>1. Backend retorna 409 "A solicitação ou as permissões foram alteradas"<br>2. Frontend recarrega lista<br><br>**FA-02: Admin perde permissão durante operação**<br>1. Validação `arrayFilters` falha (modifiedCount !== 1)<br>2. Mesmo erro 409 |
| **Regras de Negócio** | - RN-25: Apenas ADMIN da mesma organização pode aprovar<br>- RN-26: Apenas solicitações `PENDENTE` podem ser aprovadas<br>- RN-27: Operação atômica previne race conditions<br>- RN-28: Campo `aprovado_em` preenchido apenas na aprovação |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC8 - Caso de uso "Aprovar solicitação de acesso" |

---

### RF-09: Rejeitar solicitação de acesso

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-09 |
| **Nome** | Rejeitar solicitação de acesso |
| **Ator Principal** | Admin da Organização |
| **Atores Secundários** | Sistema, Usuário Solicitante |
| **Descrição** | Admin rejeita solicitação de acesso, alterando status do vínculo para `REJEITADO` e removendo data de aprovação. |
| **Pré-condições** | - Admin autenticado, ADMIN aprovado na org<br>- Organização APROVADA<br>- Solicitação existe com status `PENDENTE` |
| **Pós-condições** | - Vínculo atualizado: `status: REJEITADO`, `aprovado_em` removido (`$unset`)<br>- Usuário vê org na aba "Recusadas" e pode solicitar novamente |
| **Fluxo Principal** | 1. Admin visualiza solicitações pendentes (RF-07)<br>2. Admin clica "Rejeitar" no card do usuário<br>3. Sistema faz `PATCH /organizacoes/:id/membros/:usuarioId` com `{ status: "REJEITADO" }`<br>4. Backend validações idênticas à aprovação<br>5. Backend faz `updateOne` com `arrayFilters`:<br>   - `$set: { 'membros.$[alvo].status': 'REJEITADO' }`<br>   - `$unset: { 'membros.$[alvo].aprovado_em': '' }`<br>6. Sistema retorna sucesso<br>7. Frontend atualiza: move usuário para aba "Recusadas", etiqueta "Solicitação recusada" (erro) |
| **Fluxos Alternativos** | **FA-01: Mesmos de RF-08** (concorrência, permissão alterada) |
| **Regras de Negócio** | - RN-29: Apenas ADMIN da mesma organização pode rejeitar<br>- RN-30: Rejeição remove `aprovado_em` se existia<br>- RN-31: Usuário rejeitado pode solicitar acesso novamente (novo vínculo PENDENTE) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC9 - Caso de uso "Rejeitar solicitação de acesso" |

---

### RF-10: Visualizar membros aprovados

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-10 |
| **Nome** | Visualizar membros aprovados |
| **Ator Principal** | Admin da Organização |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin visualiza lista de membros com acesso aprovado na organização, ordenados por papel (admins primeiro) e nome. |
| **Pré-condições** | - Admin autenticado, ADMIN aprovado na org<br>- Organização APROVADA |
| **Pós-condições** | - Lista de membros aprovados exibida com ações disponíveis |
| **Fluxo Principal** | 1. Admin acessa tela "Membros da organização"<br>2. Sistema carrega organização com membros (RF-07)<br>3. Frontend filtra `membros.status === APROVADO`<br>4. Ordena: ADMIN primeiro, depois MEMBRO, ambos por nome (pt-BR)<br>5. Exibe cards com: avatar, nome, email, papel (ADMIN/MEMBRO), etiqueta "Aprovado" (sucesso)<br>6. Para MEMBRO: exibe botão "Remover acesso"<br>7. Para ADMIN: não exibe botão remover (proteção) |
| **Fluxos Alternativos** | **FA-01: Nenhum membro aprovado**<br>1. Frontend exibe "Não há membros aprovados" |
| **Regras de Negócio** | - RN-32: Admins listados primeiro<br>- RN-33: Não é permitido remover administradores da organização<br>- RN-34: Apenas membros APROVADOS aparecem aqui |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC10 - Caso de uso "Visualizar membros aprovados" |

---

### RF-11: Remover membro da organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-11 |
| **Nome** | Remover membro da organização |
| **Ator Principal** | Admin da Organização |
| **Atores Secundários** | Sistema, Usuário Removido |
| **Descrição** | Admin remove membro aprovado da organização, revogando seu acesso e removendo de comissões vinculadas. |
| **Pré-condições** | - Admin autenticado, ADMIN aprovado na org<br>- Organização APROVADA<br>- Membro alvo: `papel: MEMBRO`, `status: APROVADO` |
| **Pós-condições** | - Vínculo removido do array `membros` da organização<br>- Usuário removido de todas as comissões da organização<br>- Usuário pode solicitar acesso novamente no futuro |
| **Fluxo Principal** | 1. Admin visualiza membros aprovados (RF-10)<br>2. Admin clica "Remover acesso" no card do membro<br>3. Frontend abre modal de confirmação com aviso: "A pessoa também sairá das comissões desta organização. Sua conta e vínculos com outras organizações serão preservados."<br>4. Admin confirma<br>5. Sistema faz `DELETE /organizacoes/:id/membros/:usuarioId`<br>6. Backend valida: solicitante ADMIN aprovado, alvo MEMBRO aprovado<br>7. Backend faz `updateOne` com `$pull: { membros: { usuario_id: alvoId } }`<br>8. Backend faz `updateMany` em comissões: `$pull: { membros: { usuario_id: alvoId } }`<br>9. Sistema retorna sucesso<br>10. Frontend remove card da lista, exibe mensagem de sucesso |
| **Fluxos Alternativos** | **FA-01: Tentativa de remover ADMIN**<br>1. Backend retorna 403 "Não é permitido remover administradores"<br><br>**FA-02: Membro não está aprovado**<br>1. Backend retorna 409 "Apenas membros aprovados podem ser removidos"<br><br>**FA-03: Concorrência/permissão alterada**<br>1. Backend retorna 409 "O vínculo ou as permissões mudaram" |
| **Regras de Negócio** | - RN-35: Não é permitido remover ADMINs da organização<br>- RN-36: Apenas membros `APROVADO` podem ser removidos<br>- RN-37: Remoção cascata em comissões da organização<br>- RN-38: Conta do usuário preservada (apenas vínculo removido) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC11 - Caso de uso "Remover membro da organização" |

---

### RF-12: Criar organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-12 |
| **Nome** | Criar organização |
| **Ator Principal** | Admin do Sistema |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin do sistema cria nova organização; criador torna-se ADMIN aprovado automaticamente; organização inicia com status `PENDENTE`. |
| **Pré-condições** | - Usuário autenticado com `tipo: ADMIN_SISTEMA`<br>- Nome único no sistema |
| **Pós-condições** | - Organização criada com `status: PENDENTE`<br>- Criador adicionado como `ADMIN` + `APROVADO` em `membros`<br>- `criada_por` referencia o admin<br>- `solicitado_em` e `aprovado_em` preenchidos para o criador |
| **Fluxo Principal** | 1. Admin do sistema acessa tela "Gerenciar organizações"<br>2. Admin clica "Nova organização" (ou usa API direta)<br>3. Sistema faz `POST /organizacoes` com `{ nome, descricao? }`<br>4. Backend valida: usuário existe, nome único (regex case-insensitive)<br>5. Backend cria organização com:<br>   - `status: PENDENTE`<br>   - `criada_por: adminId`<br>   - `membros: [{ usuario_id: adminId, papel: ADMIN, status: APROVADO, solicitado_em: now, aprovado_em: now }]`<br>6. Sistema retorna organização criada<br>7. Frontend lista org com etiqueta "Pendente" (alerta) |
| **Fluxos Alternativos** | **FA-01: Nome duplicado**<br>1. Backend retorna 409 "Já existe uma organização com este nome"<br><br>**FA-02: Usuário não é ADMIN_SISTEMA**<br>1. Guard `UsuarioComumGuard` bloqueia (403) |
| **Regras de Negócio** | - RN-39: Apenas ADMIN_SISTEMA pode criar organizações<br>- RN-40: Nome único (case-insensitive)<br>- RN-41: Criador vira ADMIN aprovado automaticamente<br>- RN-42: Nova org nasce `PENDENTE` (precisa aprovação de outro ADMIN_SISTEMA) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC12 - Caso de uso "Criar organização" |

---

### RF-13: Listar todas as organizações

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-13 |
| **Nome** | Listar todas as organizações |
| **Ator Principal** | Admin do Sistema |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin do sistema visualiza todas as organizações cadastradas (qualquer status) com informações de criador e status. |
| **Pré-condições** | - Usuário autenticado com `tipo: ADMIN_SISTEMA` |
| **Pós-condições** | - Lista completa de organizações retornada |
| **Fluxo Principal** | 1. Admin do sistema acessa tela "Gerenciar organizações" (`/organizacoes/aprovacao`)<br>2. Sistema faz `GET /organizacoes` com token ADMIN_SISTEMA<br>3. Backend retorna todas as orgs (sem filtro de status) com populate `criada_por` e `membros.usuario_id`<br>4. Frontend ordena: PENDENTE → APROVADA → REVOGADA<br>5. Exibe cards com: nome, descrição, status (etiqueta colorida), criador, botões de ação por status |
| **Fluxos Alternativos** | **FA-01: Nenhuma organização**<br>1. Frontend exibe "Nenhuma organização cadastrada" |
| **Regras de Negócio** | - RN-43: ADMIN_SISTEMA vê todas orgs independente de status<br>- RN-44: Ordenação fixa: PENDENTE (0), APROVADA (1), REVOGADA (2) |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC13 - Caso de uso "Listar todas as organizações" |

---

### RF-14: Aprovar organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-14 |
| **Nome** | Aprovar organização |
| **Ator Principal** | Admin do Sistema |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin do sistema altera status de organização de `PENDENTE` para `APROVADA`, permitindo solicitações de acesso. |
| **Pré-condições** | - Admin do sistema autenticado<br>- Organização com `status: PENDENTE` |
| **Pós-condições** | - Organização `status: APROVADA`<br>- Usuários podem solicitar acesso (RF-05)<br>- Admins da org podem gerenciar membros (RF-07 a RF-11) |
| **Fluxo Principal** | 1. Admin do sistema visualiza lista de organizações (RF-13)<br>2. Identifica org com etiqueta "Pendente"<br>3. Clica "Autorizar"<br>4. Sistema faz `PATCH /organizacoes/:id` com `{ status: "APROVADA" }`<br>5. Backend valida: solicitante é ADMIN_SISTEMA<br>6. Backend atualiza status<br>7. Frontend atualiza etiqueta para "Aprovada" (sucesso), mostra botão "Revogar" |
| **Fluxos Alternativos** | **FA-01: Organização já aprovada**<br>1. Botão "Autorizar" não exibido para orgs APROVADA |
| **Regras de Negócio** | - RN-45: Apenas ADMIN_SISTEMA pode aprovar organizações<br>- RN-46: Org APROVADA habilita fluxo de solicitação de acesso por usuários comuns |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC14 - Caso de uso "Aprovar organização" |

---

### RF-15: Revogar organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-15 |
| **Nome** | Revogar organização |
| **Ator Principal** | Admin do Sistema |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin do sistema altera status de organização de `APROVADA` para `REVOGADA`, bloqueando novos acessos e gestão de membros. |
| **Pré-condições** | - Admin do sistema autenticado<br>- Organização com `status: APROVADA` |
| **Pós-condições** | - Organização `status: REVOGADA`<br>- Novas solicitações de acesso bloqueadas<br>- Admins da org não conseguem mais gerenciar membros<br>- Preparada para exclusão (RF-16) |
| **Fluxo Principal** | 1. Admin do sistema visualiza lista (RF-13)<br>2. Identifica org "Aprovada"<br>3. Clica "Revogar"<br>4. Sistema faz `PATCH /organizacoes/:id` com `{ status: "REVOGADA" }`<br>5. Backend valida ADMIN_SISTEMA<br>6. Backend atualiza status<br>7. Frontend atualiza etiqueta para "Revogada" (erro), mostra botão "Excluir" |
| **Fluxos Alternativos** | **FA-01: Organização já revogada/pendente**<br>1. Botão "Revogar" só aparece para APROVADA |
| **Regras de Negócio** | - RN-47: Apenas ADMIN_SISTEMA pode revogar<br>- RN-48: Org REVOGADA não aceita solicitações nem gestão de membros<br>- RN-49: Revogação é pré-requisito para exclusão |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC15 - Caso de uso "Revogar organização" |

---

### RF-16: Excluir organização

| Campo | Descrição |
|-------|-----------|
| **Código** | RF-16 |
| **Nome** | Excluir organização |
| **Ator Principal** | Admin do Sistema |
| **Atores Secundários** | Sistema |
| **Descrição** | Admin do sistema exclui permanentemente uma organização revogada e suas comissões associadas. |
| **Pré-condições** | - Admin do sistema autenticado<br>- Organização com `status: REVOGADA` |
| **Pós-condições** | - Organização removida do banco<br>- Todas as comissões da organização deletadas<br>- Vínculos de usuários removidos implicitamente |
| **Fluxo Principal** | 1. Admin do sistema visualiza org "Revogada" (RF-13)<br>2. Clica "Excluir"<br>3. Frontend abre modal de confirmação: "Excluir [nome]? A organização e as comissões dela serão apagadas de vez."<br>4. Admin confirma<br>5. Sistema faz `DELETE /organizacoes/:id`<br>6. Backend valida: ADMIN_SISTEMA + status REVOGADA (filtro no deleteOne)<br>7. Backend deleta organização<br>8. Backend deleta comissões vinculadas (`deleteMany organizacao_id`)<br>9. Sistema retorna sucesso<br>10. Frontend remove card da lista |
| **Fluxos Alternativos** | **FA-01: Tentativa de excluir sem revogar**<br>1. Backend retorna 409 "Revogue a organização antes de excluí-la"<br><br>**FA-02: Organização não encontrada**<br>1. Backend retorna 404 |
| **Regras de Negócio** | - RN-50: Apenas ADMIN_SISTEMA pode excluir<br>- RN-51: Exclusão só permitida se `status: REVOGADA`<br>- RN-52: Exclusão em cascata: comissões da organização também deletadas<br>- RN-53: Operação irreversível |
| **Prioridade** | Alta |
| **Rastreabilidade** | UC16 - Caso de uso "Excluir organização" |

---

## Matriz de Rastreabilidade: Requisitos ↔ Casos de Uso ↔ Regras de Negócio

| Requisito | Caso de Uso | Regras de Negócio Principais |
|-----------|-------------|------------------------------|
| RF-01 | UC1 | RN-01, RN-02, RN-03, RN-04 |
| RF-02 | UC2 | RN-05, RN-06, RN-07 |
| RF-03 | UC3 | RN-08, RN-09, RN-10, RN-11 |
| RF-04 | UC4 | RN-12, RN-13, RN-14 |
| RF-05 | UC5 | RN-15, RN-16, RN-17, RN-18 |
| RF-06 | UC6 | RN-19, RN-20, RN-21 |
| RF-07 | UC7 | RN-22, RN-23, RN-24 |
| RF-08 | UC8 | RN-25, RN-26, RN-27, RN-28 |
| RF-09 | UC9 | RN-29, RN-30, RN-31 |
| RF-10 | UC10 | RN-32, RN-33, RN-34 |
| RF-11 | UC11 | RN-35, RN-36, RN-37, RN-38 |
| RF-12 | UC12 | RN-39, RN-40, RN-41, RN-42 |
| RF-13 | UC13 | RN-43, RN-44 |
| RF-14 | UC14 | RN-45, RN-46 |
| RF-15 | UC15 | RN-47, RN-48, RN-49 |
| RF-16 | UC16 | RN-50, RN-51, RN-52, RN-53 |

---

## Glossário de Termos

| Termo | Definição |
|-------|-----------|
| **ADMIN_SISTEMA** | Administrador global da plataforma; gerencia organizações, não participa delas |
| **ADMIN (org)** | Administrador de uma organização específica; gerencia membros dessa org |
| **MEMBRO** | Usuário comum aprovado em uma organização |
| **PENDENTE** | Status inicial de organização ou solicitação de acesso, aguardando aprovação |
| **APROVADA/APROVADO** | Status ativo, funcionalidades liberadas |
| **REVOGADA** | Organização desativada pelo admin do sistema; não aceita novas operações |
| **REJEITADO** | Solicitação de acesso negada pelo admin da organização |
| **Vínculo** | Registro na array `membros` da organização: usuario_id + papel + status + datas |

---

*Documento gerado automaticamente a partir da análise do código-fonte do projeto Conecta+ (NestJS + React Native + MongoDB).*