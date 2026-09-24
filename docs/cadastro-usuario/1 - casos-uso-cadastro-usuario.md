# Diagrama de Casos de Uso

```mermaid
flowchart TB
    subgraph Atores
        Anon["👤 Usuário Não Autenticado"]
        Usuario["👤 Usuário Comum"]
        AdminOrg["🛡️ Admin da Organização"]
        AdminSistema["⚙️ Admin do Sistema"]
    end

    subgraph "Autenticação e Cadastro"
        UC1["Cadastrar-se na plataforma"]
        UC2["Fazer login"]
        UC3["Recuperar senha"]
    end

    subgraph "Usuário - Organizações"
        UC4["Visualizar organizações aprovadas"]
        UC5["Solicitar acesso a organização"]
        UC6["Acompanhar status da solicitação"]
    end

    subgraph "Admin Org - Gestão de Membros"
        UC7["Visualizar solicitações pendentes"]
        UC8["Aprovar solicitação de acesso"]
        UC9["Rejeitar solicitação de acesso"]
        UC10["Visualizar membros aprovados"]
        UC11["Remover membro da organização"]
    end

    subgraph "Admin Sistema - Gestão de Organizações"
        UC12["Criar organização"]
        UC13["Listar todas as organizações"]
        UC14["Aprovar organização"]
        UC15["Revogar organização"]
        UC16["Excluir organização"]
    end

    Anon --> UC1
    Anon --> UC2
    Anon --> UC3

    Usuario --> UC2
    Usuario --> UC4
    Usuario --> UC5
    Usuario --> UC6

    AdminOrg --> UC7
    AdminOrg --> UC8
    AdminOrg --> UC9
    AdminOrg --> UC10
    AdminOrg --> UC11

    AdminSistema --> UC12
    AdminSistema --> UC13
    AdminSistema --> UC14
    AdminSistema --> UC15
    AdminSistema --> UC16

    UC1 -.->|<<include>>| UC2
    UC5 -.->|<<include>>| UC4
    UC8 -.->|<<include>>| UC7
    UC9 -.->|<<include>>| UC7
    UC11 -.->|<<include>>| UC10
    UC14 -.->|<<include>>| UC13
    UC15 -.->|<<include>>| UC13
    UC16 -.->|<<include>>| UC15

    classDef actor fill:#e3f2fd,stroke:#1976d2,stroke-width:2px;
    classDef uc fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px;
    classDef include stroke:#ff9800,stroke-dasharray: 5 5;

    class Anon,Usuario,AdminOrg,AdminSistema actor;
    class UC1,UC2,UC3,UC4,UC5,UC6,UC7,UC8,UC9,UC10,UC11,UC12,UC13,UC14,UC15,UC16 uc;
```