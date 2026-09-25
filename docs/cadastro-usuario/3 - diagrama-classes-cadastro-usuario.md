# Diagrama de Classes - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros

```mermaid
classDiagram
    direction LR

    class Usuario {
        +ObjectId _id
        +String nome
        +String email
        +String senha_hash
        +TipoUsuario tipo
        +TemaUsuario tema
        +Boolean ativo
        +Date criado_em
        +Date atualizado_em
    }

    class Organizacao {
        +ObjectId _id
        +String nome
        +String descricao
        +StatusOrganizacao status
        +ObjectId criada_por
        +MembroOrganizacao[] membros
        +Date criado_em
        +Date atualizado_em
    }

    class MembroOrganizacao {
        +ObjectId usuario_id
        +PapelOrganizacao papel
        +StatusMembroOrganizacao status
        +Date solicitado_em
        +Date aprovado_em
    }

    class TipoUsuario {
        <<enumeration>>
        USUARIO
        ADMIN_SISTEMA
    }

    class TemaUsuario {
        <<enumeration>>
        claro
        escuro
        sistema
    }

    class StatusOrganizacao {
        <<enumeration>>
        PENDENTE
        APROVADA
        REVOGADA
    }

    class PapelOrganizacao {
        <<enumeration>>
        ADMIN
        MEMBRO
    }

    class StatusMembroOrganizacao {
        <<enumeration>>
        PENDENTE
        APROVADO
        REJEITADO
    }

    Usuario "1" --> "0..*" Organizacao : cria
    Organizacao "1" *-- "0..*" MembroOrganizacao : contém
    Usuario "1" --> "0..*" MembroOrganizacao : possui vínculo

    Usuario --> TipoUsuario : tipo
    Usuario --> TemaUsuario : tema
    Organizacao --> StatusOrganizacao : status
    MembroOrganizacao --> PapelOrganizacao : papel
    MembroOrganizacao --> StatusMembroOrganizacao : status
```

## Observações

`MembroOrganizacao` representa um subdocumento embutido dentro de `Organizacao`. Cada vínculo associa um usuário a uma organização, armazenando seu papel, situação da solicitação e datas relacionadas.

O administrador de uma organização não é um tipo global de usuário. Ele é identificado pelo vínculo em `MembroOrganizacao`, quando possui:

- `papel = ADMIN`
- `status = APROVADO`

O campo `tipo` da classe `Usuario` representa apenas o perfil global da plataforma (`USUARIO` ou `ADMIN_SISTEMA`).