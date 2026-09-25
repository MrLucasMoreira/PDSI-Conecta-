# Diagramas de Sequência - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Formato:** Mermaid (`sequenceDiagram`)  
> **Versão:** 1.0

---

## Relação dos Diagramas

| Requisito | Diagrama |
|---|---|
| RF-01 | Cadastrar-se na plataforma |
| RF-02 | Visualizar organizações disponíveis |
| RF-03 | Solicitar acesso à organização |
| RF-04 | Acompanhar status da solicitação |
| RF-05 | Visualizar solicitações pendentes |
| RF-06 | Aprovar solicitação de acesso |
| RF-07 | Rejeitar solicitação de acesso |
| RF-08 | Visualizar membros da organização |
| RF-09 | Remover membro da organização |

---

# RF-01 - Cadastrar-se na plataforma

```mermaid
sequenceDiagram
    autonumber

    actor Usuario as Usuário Não Autenticado
    participant Frontend as Frontend
    participant API as Backend API
    participant DB as MongoDB

    Usuario->>Frontend: Acessa a tela de cadastro
    Frontend-->>Usuario: Exibe formulário de cadastro

    Usuario->>Frontend: Informa nome, email, senha e confirmação

    Frontend->>Frontend: Valida os dados informados

    alt Dados inválidos
        Frontend-->>Usuario: Exibe mensagens de validação
    else Dados válidos
        Frontend->>API: POST /usuarios {nome, email, senha}
        API->>API: Normaliza o email
        API->>DB: Consulta usuário pelo email

        alt Email já cadastrado
            DB-->>API: Usuário existente
            API-->>Frontend: 409 - Email já cadastrado
            Frontend-->>Usuario: Informa que o email já está em uso
        else Email disponível
            API->>API: Gera hash da senha com bcrypt
            API->>DB: Cria usuário
            DB-->>API: Usuário criado
            API-->>Frontend: 201 - Cadastro realizado
            Frontend-->>Usuario: Informa sucesso e direciona para login
        end
    end
```

---

# RF-02 - Visualizar organizações disponíveis

```mermaid
sequenceDiagram
    autonumber

    actor Usuario as Usuário Comum
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    Usuario->>Frontend: Acessa "Participar de uma organização"
    Frontend->>API: GET /organizacoes

    API->>Guards: Valida autenticação e conta ativa

    alt Usuário não autorizado
        Guards-->>API: Acesso negado
        API-->>Frontend: 401 - Não autorizado
        Frontend-->>Usuario: Exibe mensagem de erro
    else Usuário autorizado
        Guards-->>API: Acesso permitido
        API->>DB: Busca organizações aprovadas e vínculos do usuário
        DB-->>API: Lista de organizações

        API->>API: Inclui situação do vínculo do usuário
        API-->>Frontend: Lista de organizações

        Frontend->>Frontend: Filtra organizações sem vínculo
        Frontend-->>Usuario: Exibe organizações disponíveis

        opt Nenhuma organização disponível
            Frontend-->>Usuario: Exibe estado vazio
        end
    end
```

---

# RF-03 - Solicitar acesso à organização

```mermaid
sequenceDiagram
    autonumber

    actor Usuario as Usuário Comum
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    Usuario->>Frontend: Clica "Pedir para participar"

    Frontend->>API: POST /organizacoes/:id/membros
    API->>Guards: Valida autenticação e conta ativa

    alt Usuário não autorizado
        Guards-->>API: Acesso negado
        API-->>Frontend: 401/403 - Acesso negado
        Frontend-->>Usuario: Exibe erro
    else Usuário autorizado
        Guards-->>API: Acesso permitido
        API->>DB: Busca organização

        alt Organização não encontrada
            DB-->>API: Organização inexistente
            API-->>Frontend: 404 - Organização não encontrada
            Frontend-->>Usuario: Exibe erro
        else Organização encontrada
            DB-->>API: Organização

            API->>API: Verifica se a organização está APROVADA

            alt Organização não aprovada
                API-->>Frontend: 403 - Organização indisponível
                Frontend-->>Usuario: Informa indisponibilidade
            else Organização aprovada
                API->>DB: Busca usuário ativo
                DB-->>API: Usuário

                API->>API: Verifica vínculo com a organização

                alt Vínculo já existente
                    API-->>Frontend: 409 - Vínculo já existente
                    Frontend-->>Usuario: Informa que já existe vínculo ou solicitação
                else Sem vínculo
                    API->>DB: Cria vínculo MEMBRO / PENDENTE
                    DB-->>API: Solicitação registrada
                    API-->>Frontend: Solicitação enviada
                    Frontend->>Frontend: Atualiza organização para Pendentes
                    Frontend-->>Usuario: Exibe mensagem de sucesso
                end
            end
        end
    end
```

---

# RF-04 - Acompanhar status da solicitação

```mermaid
sequenceDiagram
    autonumber

    actor Usuario as Usuário Comum
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    Usuario->>Frontend: Acessa "Participar de uma organização"
    Frontend->>API: GET /organizacoes

    API->>Guards: Valida autenticação e conta ativa

    alt Usuário não autorizado
        Guards-->>API: Acesso negado
        API-->>Frontend: 401 - Não autorizado
        Frontend-->>Usuario: Exibe mensagem de erro
    else Usuário autorizado
        Guards-->>API: Acesso permitido
        API->>DB: Busca organizações e vínculos do usuário
        DB-->>API: Organizações encontradas

        API->>API: Identifica papel e status do vínculo
        API-->>Frontend: Retorna organizações com meu_vinculo

        Frontend->>Frontend: Separa Disponíveis, Pendentes e Recusadas

        Usuario->>Frontend: Seleciona Pendentes ou Recusadas

        alt Solicitações pendentes
            Frontend-->>Usuario: Exibe solicitações com status PENDENTE
        else Solicitações rejeitadas
            Frontend-->>Usuario: Exibe solicitações com status REJEITADO
        end
    end
```

---

# RF-05 - Visualizar solicitações pendentes

```mermaid
sequenceDiagram
    autonumber

    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    AdminOrg->>Frontend: Acessa "Membros da organização"

    Frontend->>API: GET /organizacoes
    API->>Guards: Valida autenticação e conta ativa
    Guards-->>API: Acesso permitido

    API->>DB: Busca organizações relacionadas ao usuário
    DB-->>API: Lista de organizações

    API-->>Frontend: Organizações e vínculo do usuário
    Frontend->>Frontend: Filtra organizações onde papel = ADMIN e status = APROVADO

    alt Nenhuma organização administrada
        Frontend-->>AdminOrg: Informa que não há organizações administradas
    else Organização disponível
        Frontend-->>AdminOrg: Exibe organizações administradas
        AdminOrg->>Frontend: Seleciona uma organização

        Frontend->>API: GET /organizacoes/:id
        API->>Guards: Valida autenticação
        Guards-->>API: Acesso permitido

        API->>API: Verifica se usuário é ADMIN aprovado
        API->>DB: Busca organização e membros
        DB-->>API: Organização com membros
        API-->>Frontend: Dados da organização

        Frontend->>Frontend: Filtra membros com status PENDENTE

        alt Nenhuma solicitação pendente
            Frontend-->>AdminOrg: Informa que não há solicitações
        else Solicitações encontradas
            Frontend-->>AdminOrg: Exibe solicitações com opções Aprovar/Rejeitar
        end
    end
```

---

# RF-06 - Aprovar solicitação de acesso

```mermaid
sequenceDiagram
    autonumber

    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    AdminOrg->>Frontend: Seleciona "Aprovar" em uma solicitação pendente

    Frontend->>API: PATCH /organizacoes/:id/membros/:usuarioId<br/>{status: "APROVADO"}

    API->>Guards: Valida autenticação e conta ativa
    Guards-->>API: Acesso permitido

    API->>DB: Busca organização
    DB-->>API: Organização

    API->>API: Verifica se solicitante é ADMIN aprovado
    API->>API: Verifica se organização está APROVADA
    API->>API: Verifica se solicitação está PENDENTE

    alt Administrador sem permissão
        API-->>Frontend: 403 - Operação não permitida
        Frontend-->>AdminOrg: Exibe erro
    else Solicitação não está pendente
        API-->>Frontend: 409 - Solicitação já analisada
        Frontend-->>AdminOrg: Solicita atualização da lista
    else Validações aprovadas
        API->>DB: Atualiza status para APROVADO e aprovado_em
        DB-->>API: Vínculo atualizado

        API-->>Frontend: Solicitação aprovada
        Frontend->>Frontend: Move usuário para membros aprovados
        Frontend-->>AdminOrg: Exibe confirmação de aprovação
    end
```

---

# RF-07 - Rejeitar solicitação de acesso

```mermaid
sequenceDiagram
    autonumber

    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    AdminOrg->>Frontend: Seleciona "Rejeitar" em uma solicitação pendente

    Frontend->>API: PATCH /organizacoes/:id/membros/:usuarioId<br/>{status: "REJEITADO"}

    API->>Guards: Valida autenticação e conta ativa
    Guards-->>API: Acesso permitido

    API->>DB: Busca organização
    DB-->>API: Organização

    API->>API: Verifica se solicitante é ADMIN aprovado
    API->>API: Verifica se organização está APROVADA
    API->>API: Verifica se solicitação está PENDENTE

    alt Administrador sem permissão
        API-->>Frontend: 403 - Operação não permitida
        Frontend-->>AdminOrg: Exibe erro
    else Solicitação não está pendente
        API-->>Frontend: 409 - Solicitação já analisada
        Frontend-->>AdminOrg: Solicita atualização da lista
    else Validações aprovadas
        API->>DB: Atualiza status para REJEITADO
        DB-->>API: Vínculo atualizado

        API-->>Frontend: Solicitação rejeitada
        Frontend->>Frontend: Remove solicitação da lista de pendentes
        Frontend-->>AdminOrg: Exibe confirmação da rejeição
    end
```

---

# RF-08 - Visualizar membros da organização

```mermaid
sequenceDiagram
    autonumber

    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    AdminOrg->>Frontend: Acessa "Membros da organização"

    Frontend->>API: GET /organizacoes
    API->>Guards: Valida autenticação e conta ativa
    Guards-->>API: Acesso permitido

    API->>DB: Busca organizações relacionadas ao usuário
    DB-->>API: Organizações encontradas
    API-->>Frontend: Lista de organizações

    Frontend->>Frontend: Filtra organizações administradas
    AdminOrg->>Frontend: Seleciona uma organização

    Frontend->>API: GET /organizacoes/:id
    API->>Guards: Valida autenticação
    Guards-->>API: Acesso permitido

    API->>API: Verifica se usuário é ADMIN aprovado

    alt Usuário não é administrador
        API-->>Frontend: 403 - Acesso negado
        Frontend-->>AdminOrg: Exibe mensagem de erro
    else Usuário é administrador
        API->>DB: Busca organização e membros
        DB-->>API: Organização com membros

        API-->>Frontend: Dados dos membros
        Frontend->>Frontend: Filtra membros com status APROVADO
        Frontend->>Frontend: Ordena administradores antes dos membros

        alt Nenhum membro aprovado
            Frontend-->>AdminOrg: Informa que não há membros aprovados
        else Membros encontrados
            Frontend-->>AdminOrg: Exibe nome, email, papel e status
        end
    end
```

---

# RF-09 - Remover membro da organização

```mermaid
sequenceDiagram
    autonumber

    actor AdminOrg as Admin da Organização
    participant Frontend as Frontend
    participant API as Backend API
    participant Guards as Autenticação
    participant DB as MongoDB

    AdminOrg->>Frontend: Clica "Remover acesso" em um membro
    Frontend-->>AdminOrg: Exibe confirmação da remoção

    alt Administrador cancela
        AdminOrg->>Frontend: Cancela operação
        Frontend-->>AdminOrg: Mantém membro na organização
    else Administrador confirma
        AdminOrg->>Frontend: Confirma remoção

        Frontend->>API: DELETE /organizacoes/:id/membros/:usuarioId

        API->>Guards: Valida autenticação e conta ativa
        Guards-->>API: Acesso permitido

        API->>DB: Busca organização e vínculo
        DB-->>API: Organização

        API->>API: Verifica se solicitante é ADMIN aprovado
        API->>API: Verifica se organização está APROVADA
        API->>API: Verifica papel e status do membro

        alt Usuário alvo é ADMIN
            API-->>Frontend: 403 - Administrador não pode ser removido
            Frontend-->>AdminOrg: Exibe mensagem de erro
        else Membro não está APROVADO
            API-->>Frontend: 409 - Membro não pode ser removido
            Frontend-->>AdminOrg: Exibe mensagem de erro
        else Membro válido
            API->>DB: Remove vínculo da organização

            alt Vínculo ou permissões foram alterados
                DB-->>API: Nenhum vínculo alterado
                API-->>Frontend: 409 - Atualize as informações
                Frontend-->>AdminOrg: Exibe mensagem de erro
            else Vínculo removido
                DB-->>API: Vínculo removido
                API->>DB: Remove usuário das comissões da organização
                DB-->>API: Comissões atualizadas

                API-->>Frontend: Acesso removido com sucesso
                Frontend->>Frontend: Remove membro da lista
                Frontend-->>AdminOrg: Exibe confirmação da remoção
            end
        end
    end
```

---

## Rastreabilidade

Os diagramas de sequência deste documento possuem correspondência direta com os requisitos funcionais definidos para o incremento:

```text
UC1 ↔ RF-01 ↔ Diagrama RF-01
UC2 ↔ RF-02 ↔ Diagrama RF-02
UC3 ↔ RF-03 ↔ Diagrama RF-03
UC4 ↔ RF-04 ↔ Diagrama RF-04
UC5 ↔ RF-05 ↔ Diagrama RF-05
UC6 ↔ RF-06 ↔ Diagrama RF-06
UC7 ↔ RF-07 ↔ Diagrama RF-07
UC8 ↔ RF-08 ↔ Diagrama RF-08
UC9 ↔ RF-09 ↔ Diagrama RF-09
```