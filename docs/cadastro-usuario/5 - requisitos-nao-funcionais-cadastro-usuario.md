# Requisitos Não Funcionais - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Versão:** 1.0

---

## Sumário

| Código | Categoria | Descrição Resumida | Prioridade |
|--------|-----------|-------------------|------------|
| RNF-01 | Desempenho | Tempo de resposta < 2s para operações CRUD | Alta |
| RNF-02 | Desempenho | Login e emissão de token < 1s | Alta |
| RNF-03 | Segurança | Senhas com bcrypt cost 10, nunca logadas | Crítica |
| RNF-04 | Segurança | JWT assinado, expiração configurável, claims atualizados | Crítica |
| RNF-05 | Segurança | Comunicação exclusivamente HTTPS em produção | Crítica |
| RNF-06 | Segurança | Rate limiting em endpoints de autenticação | Alta |
| RNF-07 | Segurança | Tokens de recuperação: SHA-256, 30 min, uso único | Alta |
| RNF-08 | Segurança | Prevenção de enumeração de emails (mensagens genéricas) | Alta |
| RNF-09 | Segurança | Guards de autorização em todos endpoints sensíveis | Crítica |
| RNF-10 | Disponibilidade | Health check endpoint para monitoramento | Média |
| RNF-11 | Confiabilidade | Operações atômicas em aprovação/rejeição/remoção (arrayFilters) | Alta |
| RNF-12 | Confiabilidade | Soft delete usuário (ativo=false), hard delete org só se revogada | Média |
| RNF-13 | Escalabilidade | Stateless API (JWT), horizontal scaling ready | Média |
| RNF-14 | Usabilidade | Validação client-side + server-side com mensagens claras | Alta |
| RNF-15 | Usabilidade | Feedback visual imediato (loading, toasts, estados vazios) | Alta |
| RNF-16 | Manutenibilidade | Código TypeScript strict, DTOs validados (class-validator) | Média |
| RNF-17 | Manutenibilidade | Testes unitários e e2e (Vitest) | Média |
| RNF-18 | Operacional | Logs estruturados (erros, auditoria de ações sensíveis) | Média |
| RNF-19 | Conformidade | LGPD: direito ao esquecimento (desativação), dados mínimos | Alta |
| RNF-20 | Conformidade | Auditoria de ações administrativas (aprovação, remoção, exclusão) | Média |

---

## Detalhamento por Categoria

---

### 1. Desempenho (Performance)

#### RNF-01: Tempo de Resposta - Operações CRUD
| Atributo | Valor |
|----------|-------|
| **Descrição** | Todas as operações de cadastro, listagem, atualização e consulta devem responder em até 2 segundos sob carga normal |
| **Métrica** | p95 < 2s, p99 < 5s |
| **Endpoints Afetados** | `POST /usuarios`, `GET /usuarios`, `PATCH /usuarios/:id`, `GET /organizacoes`, `POST /organizacoes`, `POST /organizacoes/:id/membros`, `PATCH /organizacoes/:id/membros/:usuarioId` |
| **Implementação Atual** | Índices MongoDB em `email`, `nome`, `status`, `membros.usuario_id`; queries com `lean()` onde possível; `populate` seletivo |
| **Gargalos Conhecidos** | `GET /organizacoes` com populate de membros pode ser lento para orgs grandes (>500 membros) - considerar paginação futura |
| **Teste Sugerido** | Load test com 100 usuários concorrentes criando/solicitando acesso |

#### RNF-02: Tempo de Resposta - Autenticação
| Atributo | Valor |
|----------|-------|
| **Descrição** | Login e emissão de JWT deve completar em < 1s |
| **Métrica** | p95 < 1s |
| **Endpoints** | `POST /auth/login`, `POST /auth/recuperar-conta`, `POST /auth/redefinir-senha` |
| **Implementação Atual** | Busca única por email + bcrypt compare (cost 10 ~ 100ms) + JWT sign |
| **Observação** | Bcrypt cost 10 é intencionalmente lento para segurança; não reduzir |

---

### 2. Segurança (Security)

#### RNF-03: Armazenamento Seguro de Senhas
| Atributo | Valor |
|----------|-------|
| **Descrição** | Senhas nunca armazenadas em texto plano; hash bcrypt com cost 10 |
| **Implementação** | `UsuarioService.criar`, `atualizar`, `alterarSenha` → `bcrypt.hash(senha, 10)` |
| **Proteção Extra** | Campo `senha_hash` com `select: false` no schema (não vem em queries normais) |
| **Compatibilidade** | Campo legado `senhaHash` mantido para migração gradual |
| **Validação** | `AlterarSenhaDto` exige senha atual + nova diferente da atual |

#### RNF-04: Autenticação Baseada em JWT
| Atributo | Valor |
|----------|-------|
| **Descrição** | Tokens JWT assinados (HS256/RS256), expiração configurável, claims atualizados a cada request |
| **Claims** | `sub` (userId), `email`, `tipo` (USUARIO/ADMIN_SISTEMA) |
| **Renovação de Permissões** | `JwtAuthGuard` busca usuário no DB a cada request e atualiza `tipo` no `req.usuario` (permite mudança de role sem relogin) |
| **Validação** | `UsuarioAtivoGuard` revalida `ativo: true` em rotas de organizações |
| **Expiração** | Configurável via `JWT_EXPIRES_IN` (ex: 24h) |
| **Logout** | Client-side (remoção do token); server-side: token invalidado se usuário desativado |

#### RNF-05: Comunicação Segura (HTTPS)
| Atributo | Valor |
|----------|-------|
| **Descrição** | Todas as comunicações em produção devem usar TLS 1.2+ |
| **Implementação** | Responsabilidade da infraestrutura (reverse proxy, load balancer, cert-manager) |
| **Headers Recomendados** | `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy` |
| **Cookies** | Não usado (token em header Authorization); se usar cookies: `Secure`, `HttpOnly`, `SameSite=Strict` |

#### RNF-06: Rate Limiting / Brute Force Protection
| Atributo | Valor |
|----------|-------|
| **Descrição** | Limitar tentativas de login, cadastro e recuperação de senha por IP/usuário |
| **Status Atual** | **Não implementado no código** - deve ser adicionado no API Gateway / NestJS `ThrottlerModule` |
| **Recomendação** | - Login: 5 tentativas/min/IP<br>- Cadastro: 3 tentativas/min/IP<br>- Recuperação: 1 solicitação/hora/email |
| **Prioridade** | Alta - gap de segurança identificado |

#### RNF-07: Recuperação de Senha Segura
| Atributo | Valor |
|----------|-------|
| **Token** | 32 bytes aleatórios (hex) → `randomBytes(32)` |
| **Armazenamento** | Hash SHA-256 no campo `reset_senha_token_hash` (`select: false`) |
| **Expiração** | 30 minutos (`reset_senha_expira_em`) |
| **Uso Único** | Token invalidado após uso (`$unset` nos campos) |
| **Entrega** | Email via Nodemailer (SMTP ou jsonTransport dev) |
| **Prevenção Enumeração** | Mesma mensagem de sucesso mesmo se email não existir |

#### RNF-08: Prevenção de Enumeração de Usuários
| Atributo | Valor |
|----------|-------|
| **Descrição** | Respostas genéricas para evitar descobrir emails cadastrados |
| **Implementação** | - Login: "Email ou senha inválidos" (não distingue usuário inexistente de senha errada)<br>- Recuperação: "Se existir conta ativa, enviaremos instruções"<br>- Cadastro: "Já existe um usuário com este email" (necessário para UX, mas expõe existência) |
| **Mitigação Cadastro** | Considerar verificação de email antes de confirmar existência (fluxo "verifique sua caixa de entrada") |

#### RNF-09: Autorização Baseada em Guards (Defesa em Profundidade)
| Guard | Protege | Regra |
|-------|---------|-------|
| `JwtAuthGuard` | Todas rotas autenticadas | Token válido + usuário ativo |
| `UsuarioAtivoGuard` | Rotas `/organizacoes/*` | Revalida `ativo: true` |
| `AdminSistemaGuard` | `POST/PATCH/DELETE /organizacoes` (gestão org) | `tipo === ADMIN_SISTEMA` |
| `UsuarioComumGuard` | `POST /organizacoes`, `POST/PATCH/DELETE /organizacoes/:id/membros` | `tipo !== ADMIN_SISTEMA` |
| `exigirAdministrador` (service) | `GET/PATCH/DELETE /organizacoes/:id/membros` | `papel=ADMIN` + `status=APROVADO` na org alvo |
| `exigirOrganizacaoAprovada` (service) | Gestão de membros | `organizacao.status === APROVADA` |

---

### 3. Disponibilidade e Confiabilidade

#### RNF-10: Health Check / Monitoramento
| Atributo | Valor |
|----------|-------|
| **Descrição** | Endpoint para verificar saúde da aplicação e dependências (MongoDB) |
| **Status Atual** | **Não implementado** - recomendar `TerminusModule` (NestJS) |
| **Sugestão** | `GET /health` → `{ status: 'ok', checks: { db: 'up', memory: 'ok' } }` |

#### RNF-11: Atomicidade em Operações Críticas
| Atributo | Valor |
|----------|-------|
| **Descrição** | Aprovação, rejeição e remoção de membros devem ser atômicas (evitar race conditions) |
| **Implementação** | `OrganizacoesService.atualizarStatusMembro` e `removerMembro` usam `updateOne` com `arrayFilters` + validação `modifiedCount === 1` |
| **Exemplo** | Aprovação: `$set: { 'membros.$[alvo].status': 'APROVADO', 'membros.$[alvo].aprovado_em': now }` com filtro `alvo.usuario_id` + `alvo.status: PENDENTE` |
| **Garantia** | Operação em documento único MongoDB = atômica |

#### RNF-12: Estratégia de Exclusão (Soft/Hard Delete)
| Entidade | Estratégia | Detalhe |
|----------|------------|---------|
| `Usuario` | **Soft Delete** | `ativo: false` (mantém histórico, impede login) |
| `Organizacao` | **Hard Delete condicional** | Só se `status: REVOGADA`; deleta comissões em cascata |
| `MembroOrganizacao` | **Hard Delete** | `$pull` do array (remoção física do vínculo) |
| **Recuperação** | Usuário pode ser reativado por `ADMIN_SISTEMA`; org não (precisa recriar) |

---

### 4. Escalabilidade

#### RNF-13: Arquitetura Stateless / Horizontal Scaling
| Atributo | Valor |
|----------|-------|
| **Descrição** | API sem estado de sessão no servidor; escalável horizontalmente |
| **Implementação** | JWT stateless; sessão no cliente (SecureStore/localStorage) |
| **Dependências Externas** | MongoDB (cluster replica set), Redis (se adicionar rate limiting/cache) |
| **Sessão** | Token no header `Authorization: Bearer <jwt>` - não usa cookies de sessão server-side |
| **Deploy** | Múltiplas instâncias do backend atrás de load balancer |

---

### 5. Usabilidade

#### RNF-14: Validação Dupla (Client + Server)
| Atributo | Valor |
|----------|-------|
| **Client-Side** | React Native: `validarNome`, `validarEmail`, `validarSenha`, `validarConfirmacaoSenha` em `utils/validacao.ts` |
| **Server-Side** | DTOs com `class-validator` (`@IsString`, `@MinLength`, `@MaxLength`, `@IsEmail`, `@IsIn`) + validações custom no Service |
| **Mensagens** | Português brasileiro, claras e acionáveis (ex: "A nova senha deve ser diferente da senha atual") |
| **Feedback Visual** | `FaixaAviso` (erro/sucesso/alerta/info), `CampoTexto` com `erro` prop, `Botao` com `carregando` |

#### RNF-15: Feedback Visual e Estados de UI
| Estado | Implementação Frontend |
|--------|------------------------|
| Carregamento lista | `Carregando` component + `carregando` state |
| Ação em andamento | `Botao` com `carregando` + `tituloCarregando` |
| Lista vazia | `EstadoVazio` com ícone e mensagem contextual por aba |
| Sucesso/Erro | `FaixaAviso` com `tom: 'sucesso' \| 'erro' \| 'alerta' \| 'informacao'` |
| Confirmação destrutiva | `Confirmacao` modal (remover membro, excluir org) |
| Acessibilidade | `accessibilityRole`, `rotuloAcessivel`, `hitSlop` em áreas de toque |

---

### 6. Manutenibilidade

#### RNF-16: Qualidade de Código TypeScript
| Atributo | Valor |
|----------|-------|
| **Strict Mode** | `tsconfig.json` com `strict: true`, `noImplicitAny`, `strictNullChecks` |
| **Validação DTOs** | `class-validator` + `class-transformer` + `ValidationPipe` global |
| **Tipagem** | Interfaces/types compartilhados via `schemas/*.ts` (backend) e `services/api.ts` (frontend) |
| **ESLint** | Configurado no frontend (`.eslintrc.js`) e backend |

#### RNF-17: Cobertura de Testes
| Atributo | Valor |
|----------|-------|
| **Framework** | Vitest (unit + e2e) |
| **Config** | `vitest.config.ts`, `vitest.config.e2e.ts` |
| **Cobertura Atual** | Arquivos `*.spec.ts` em `usuarios/`, `organizacoes/`, `auth/`, `comissoes/` |
| **Gap** | Testes de integração para fluxos completos (cadastro → login → solicitar → aprovar) |

---

### 7. Operacionalidade

#### RNF-18: Logs e Auditoria
| Atributo | Valor |
|----------|-------|
| **Logs Atuais** | `console.log` em desenvolvimento (link recuperação senha); `console.error` em exceções |
| **Necessário** | Logger estruturado (Pino/Winston) com níveis: `info`, `warn`, `error` |
| **Eventos de Auditoria** | - Login bem-sucedido/falha<br>- Cadastro usuário<br>- Criação/APROVAÇÃO/REVOGAÇÃO/EXCLUSÃO organização<br>- Aprovação/Rejeição/Remoção membro<br>- Alteração de senha/recuperação |
| **Campos Mínimos** | `timestamp`, `level`, `userId`, `action`, `resource`, `resourceId`, `ip`, `userAgent`, `success` |

---

### 8. Conformidade (LGPD / Boas Práticas)

#### RNF-19: Proteção de Dados Pessoais (LGPD)
| Princípio | Implementação |
|-----------|---------------|
| **Minimização** | Coleta apenas: nome, email, senha (hash), preferência tema |
| **Finalidade** | Dados usados apenas para autenticação e gestão de organizações |
| **Acesso** | Usuário vê próprio perfil (`GET /usuarios/me`) |
| **Retificação** | `PATCH /usuarios/me` (nome, email, tema) |
| **Exclusão/Direito ao Esquecimento** | `DELETE /usuarios/:id` (AdminSistema) → `ativo: false` (soft delete); não há endpoint de exclusão própria (gap) |
| **Portabilidade** | Não implementado (exportar dados) |
| **Retenção** | Dados mantidos enquanto conta ativa; desativados preservam histórico |

#### RNF-20: Auditoria de Ações Administrativas
| Ação | Quem | Log Necessário |
|------|------|----------------|
| Criar organização | ADMIN_SISTEMA | `orgId`, `nome`, `criada_por`, `timestamp` |
| Aprovar/Revogar/Excluir org | ADMIN_SISTEMA | `orgId`, `acao`, `adminId`, `timestamp` |
| Aprovar/Rejeitar solicitação | ADMIN_ORG | `orgId`, `usuarioId`, `acao`, `adminId`, `timestamp` |
| Remover membro | ADMIN_ORG | `orgId`, `usuarioId`, `adminId`, `timestamp` |
| Alterar senha usuário | Próprio/ADMIN_SISTEMA | `usuarioId`, `atorId`, `timestamp` |

---

## Matriz de Rastreabilidade: RNF → Código / Componente

| RNF | Componente / Arquivo | Status |
|-----|---------------------|--------|
| RNF-01 | `UsuarioService`, `OrganizacoesService`, índices MongoDB | Implementado |
| RNF-02 | `AuthService.login`, bcrypt cost 10 | Implementado |
| RNF-03 | `UsuarioSchema` (`select: false`), `bcrypt.hash(..., 10)` | Implementado |
| RNF-04 | `AuthService.login`, `JwtAuthGuard`, `JwtService` | Implementado |
| RNF-05 | Infra (nginx/Traefik/cert-manager) | **Pendente infra** |
| RNF-06 | **Ausente** - adicionar `ThrottlerModule` | **Gap** |
| RNF-07 | `AuthService.solicitarRecuperacao`/`redefinirSenha` | Implementado |
| RNF-08 | `AuthService.login`, `solicitarRecuperacao` | Parcial (cadastro expõe) |
| RNF-09 | `auth/*.guard.ts`, `organizacoes/usuario-ativo.guard.ts`, `exigirAdministrador` | Implementado |
| RNF-10 | **Ausente** - adicionar `TerminusModule` | **Gap** |
| RNF-11 | `OrganizacoesService.atualizarStatusMembro`, `removerMembro` (arrayFilters) | Implementado |
| RNF-12 | `UsuarioService.remover` (soft), `OrganizacoesService.remover` (hard condicional) | Implementado |
| RNF-13 | JWT stateless, sem sessão server-side | Implementado |
| RNF-14 | `utils/validacao.ts` (frontend), `dto/*.ts` + `ValidationPipe` (backend) | Implementado |
| RNF-15 | `FaixaAviso`, `Carregando`, `EstadoVazio`, `Confirmacao`, `Botao.carregando` | Implementado |
| RNF-16 | `tsconfig.json`, `class-validator`, ESLint | Implementado |
| RNF-17 | `vitest.config.ts`, `*.spec.ts` | Parcial (faltam e2e fluxos completos) |
| RNF-18 | `console.log/error` apenas | **Gap** - logger estruturado |
| RNF-19 | Soft delete usuário, dados mínimos | Parcial (falta exportação, exclusão própria) |
| RNF-20 | **Ausente** - auditoria estruturada | **Gap** |

---

## Gaps Identificados e Plano de Ação Sugerido

| Prioridade | Gap | Ação Recomendada | Esforço |
|------------|-----|------------------|---------|
| **Crítica** | Rate limiting (RNF-06) | Adicionar `@nestjs/throttler` com guards em `/auth/*` e `/usuarios` | Baixo |
| **Crítica** | HTTPS headers (RNF-05) | Configurar no reverse proxy + `helmet` no NestJS | Baixo |
| **Alta** | Logger estruturado (RNF-18) | Integrar `pino` + `nest-pino` | Médio |
| **Alta** | Health check (RNF-10) | Adicionar `@nestjs/terminus` | Baixo |
| **Média** | Auditoria ações admin (RNF-20) | Interceptor/Decorator `@Audit()` + collection `auditoria` | Médio |
| **Média** | Exportação dados usuário (RNF-19) | Endpoint `GET /usuarios/me/export` (JSON) | Baixo |
| **Média** | Exclusão própria conta (RNF-19) | `DELETE /usuarios/me` com confirmação de senha | Baixo |
| **Baixa** | Paginação `GET /organizacoes` (RNF-01) | `skip`/`limit` + `total` no response | Médio |
| **Baixa** | Testes e2e fluxos completos (RNF-17) | Cenários: cadastro→login→solicitar→aprovar→remover | Alto |

---

## Referências Técnicas

- **OWASP ASVS 4.0** - Authentication (V2), Session Management (V3), Access Control (V4)
- **LGPD (Lei 13.709/2018)** - Art. 7º (bases legais), Art. 18 (direitos do titular), Art. 46 (segurança)
- **NestJS Security Docs** - Guards, Pipes, Helmet, Throttler, Terminus
- **MongoDB Security Checklist** - Authentication, Authorization, Encryption, Auditing
- **bcrypt Cost Factor** - OWASP recomenda cost 10-12 (atual: 10 ✓)

---

*Documento baseado na análise do código-fonte atual (NestJS + React Native + MongoDB) e boas práticas de mercado. Gaps marcados devem ser priorizados no backlog técnico.*