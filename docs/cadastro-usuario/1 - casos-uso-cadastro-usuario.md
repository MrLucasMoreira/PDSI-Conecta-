# Diagrama de Casos de Uso

## Visão Geral

```mermaid
flowchart LR
    Anon["👤 Usuário Não Autenticado"]
    Usuario["👤 Usuário Comum"]
    AdminOrg["🛡️ Admin da Organização"]
    AdminSistema["⚙️ Admin do Sistema"]

    Auth["Autenticação e Cadastro"]
    Org["Organizações"]
    Membros["Gestão de Membros"]
    GestaoOrg["Gestão de Organizações"]

    Anon --> Auth
    Usuario --> Auth
    Usuario --> Org
    AdminOrg --> Membros
    AdminSistema --> GestaoOrg

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef modulo fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Anon,Usuario,AdminOrg,AdminSistema actor;
    class Auth,Org,Membros,GestaoOrg modulo;
```

---

## Autenticação e Cadastro

```mermaid
flowchart LR
    Anon["👤 Usuário Não Autenticado"]
    Usuario["👤 Usuário Comum"]

    UC1["Cadastrar-se na plataforma"]
    UC2["Fazer login"]
    UC3["Recuperar senha"]

    Anon --> UC1
    Anon --> UC2
    Anon --> UC3

    Usuario --> UC2

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Anon,Usuario actor;
    class UC1,UC2,UC3 uc;
```

---

## Usuário - Organizações

```mermaid
flowchart LR
    Usuario["👤 Usuário Comum"]

    UC4["Visualizar organizações aprovadas"]
    UC5["Solicitar acesso à organização"]
    UC6["Acompanhar status da solicitação"]

    Usuario --> UC4
    Usuario --> UC5
    Usuario --> UC6

    UC5 -.->|include| UC4

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class Usuario actor;
    class UC4,UC5,UC6 uc;
```

---

## Admin da Organização - Gestão de Membros

```mermaid
flowchart LR
    AdminOrg["🛡️ Admin da Organização"]

    UC7["Visualizar solicitações pendentes"]
    UC8["Aprovar solicitação de acesso"]
    UC9["Rejeitar solicitação de acesso"]
    UC10["Visualizar membros aprovados"]
    UC11["Remover membro da organização"]

    AdminOrg --> UC7
    AdminOrg --> UC8
    AdminOrg --> UC9
    AdminOrg --> UC10
    AdminOrg --> UC11

    UC8 -.->|include| UC7
    UC9 -.->|include| UC7
    UC11 -.->|include| UC10

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class AdminOrg actor;
    class UC7,UC8,UC9,UC10,UC11 uc;
```

---

## Admin do Sistema - Gestão de Organizações

```mermaid
flowchart LR
    AdminSistema["⚙️ Admin do Sistema"]

    UC12["Criar organização"]
    UC13["Listar todas as organizações"]
    UC14["Aprovar organização"]
    UC15["Revogar organização"]
    UC16["Excluir organização"]

    AdminSistema --> UC12
    AdminSistema --> UC13
    AdminSistema --> UC14
    AdminSistema --> UC15
    AdminSistema --> UC16

    UC14 -.->|include| UC13
    UC15 -.->|include| UC13
    UC16 -.->|include| UC15

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;

    class AdminSistema actor;
    class UC12,UC13,UC14,UC15,UC16 uc;
```