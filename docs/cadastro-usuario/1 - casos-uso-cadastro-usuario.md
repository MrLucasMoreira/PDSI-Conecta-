# Diagrama de Casos de Uso

> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros.
>
> Este documento apresenta somente os casos de uso relacionados ao incremento solicitado.  
> A autenticação do usuário é considerada uma pré-condição para as funcionalidades que exigem acesso à plataforma.

---

## Visão Geral

```mermaid
flowchart LR
    Anon["👤 Usuário Não Autenticado"]
    Usuario["👤 Usuário Comum"]
    AdminOrg["🛡️ Admin da Organização"]

    subgraph Sistema["Conecta+ - Cadastro e Gestão de Usuários"]
        Cadastro(["UC1 - Cadastrar-se na plataforma"])
        Acesso(["Solicitação de acesso à organização"])
        Gestao(["Gestão de membros da organização"])
    end

    Anon --> Cadastro
    Usuario --> Acesso
    AdminOrg --> Gestao

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef modulo fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Anon,Usuario,AdminOrg actor;
    class Cadastro,Acesso,Gestao modulo;
```

---

## 1. Cadastro de Usuário

```mermaid
flowchart LR
    Anon["👤 Usuário Não Autenticado"]

    subgraph Sistema["Conecta+"]
        UC1(["UC1 - Cadastrar-se na plataforma"])
    end

    Anon --> UC1

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Anon actor;
    class UC1 uc;
```

### Caso de uso

- **UC1 - Cadastrar-se na plataforma:** permite que uma pessoa ainda não cadastrada crie sua conta de usuário no Conecta+.

---

## 2. Solicitação de Acesso à Organização

```mermaid
flowchart LR
    Usuario["👤 Usuário Comum"]

    subgraph Sistema["Conecta+"]
        UC2(["UC2 - Visualizar organizações disponíveis"])
        UC3(["UC3 - Solicitar acesso à organização"])
        UC4(["UC4 - Acompanhar status da solicitação"])
    end

    Usuario --> UC2
    Usuario --> UC3
    Usuario --> UC4

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Usuario actor;
    class UC2,UC3,UC4 uc;
```

### Casos de uso

- **UC2 - Visualizar organizações disponíveis:** permite ao usuário consultar organizações aprovadas disponíveis para solicitação de acesso.
- **UC3 - Solicitar acesso à organização:** permite ao usuário enviar uma solicitação para participar de uma organização.
- **UC4 - Acompanhar status da solicitação:** permite ao usuário verificar se sua solicitação está pendente, aprovada ou rejeitada.

---

## 3. Gestão de Membros da Organização

```mermaid
flowchart LR
    AdminOrg["🛡️ Admin da Organização"]

    subgraph Sistema["Conecta+"]
        UC5(["UC5 - Visualizar solicitações pendentes"])
        UC6(["UC6 - Aprovar solicitação de acesso"])
        UC7(["UC7 - Rejeitar solicitação de acesso"])
        UC8(["UC8 - Visualizar membros da organização"])
        UC9(["UC9 - Remover membro da organização"])
    end

    AdminOrg --> UC5
    AdminOrg --> UC6
    AdminOrg --> UC7
    AdminOrg --> UC8
    AdminOrg --> UC9

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class AdminOrg actor;
    class UC5,UC6,UC7,UC8,UC9 uc;
```

### Casos de uso

- **UC5 - Visualizar solicitações pendentes:** permite ao administrador visualizar usuários aguardando análise para ingresso na organização.
- **UC6 - Aprovar solicitação de acesso:** permite ao administrador autorizar o ingresso de um usuário na organização.
- **UC7 - Rejeitar solicitação de acesso:** permite ao administrador negar uma solicitação de ingresso.
- **UC8 - Visualizar membros da organização:** permite ao administrador consultar os usuários que possuem acesso aprovado à organização.
- **UC9 - Remover membro da organização:** permite ao administrador remover o acesso de um membro da organização.