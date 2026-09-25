# Dicionário de Dados - Modelo Relacional

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Base:** Modelo lógico relacional derivado da implementação MongoDB  
> **Versão:** 1.0

---

## Visão Geral

| Tabela | Descrição |
|---|---|
| `usuario` | Armazena os usuários cadastrados na plataforma. |
| `organizacao` | Representa as organizações cadastradas no sistema. |
| `membro_organizacao` | Representa o vínculo entre um usuário e uma organização. |

> No banco MongoDB real, `membro_organizacao` é armazenado como um subdocumento dentro de `organizacao.membros[]`. Neste documento ele é representado como uma tabela associativa para facilitar a compreensão do modelo relacional.

---

# 1. Tabela `usuario`

Representa as contas cadastradas na plataforma.

| Campo | Tipo | Chave | Nulo | Default | Descrição |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | PK | Não | Automático | Identificador único do usuário. |
| `nome` | `String` | - | Não | - | Nome do usuário. |
| `email` | `String` | UK | Não | - | E-mail do usuário. Deve ser único e é armazenado em letras minúsculas. |
| `senha_hash` | `String` | - | Não | - | Hash da senha do usuário. |
| `tipo` | `TipoUsuario` | - | Não | `USUARIO` | Tipo global do usuário na plataforma. |
| `tema` | `TemaUsuario` | - | Não | `sistema` | Preferência de tema da interface. |
| `ativo` | `Boolean` | - | Não | `true` | Indica se a conta está ativa. |
| `criado_em` | `Date` | - | Não | Automático | Data e hora de criação da conta. |
| `atualizado_em` | `Date` | - | Não | Automático | Data e hora da última atualização. |

### Restrições

- `_id` identifica unicamente cada usuário.
- `email` deve ser único.
- O e-mail é normalizado para letras minúsculas.
- O nome deve possuir pelo menos 2 caracteres no cadastro.
- A senha deve possuir pelo menos 8 caracteres antes de ser transformada em hash.
- O usuário criado pelo cadastro comum recebe o tipo `USUARIO`.

---

# 2. Tabela `organizacao`

Representa uma organização cadastrada na plataforma.

| Campo | Tipo | Chave | Nulo | Default | Descrição |
|---|---|---|---|---|---|
| `_id` | `ObjectId` | PK | Não | Automático | Identificador único da organização. |
| `nome` | `String` | - | Não | - | Nome da organização. |
| `descricao` | `String` | - | Sim | `NULL` | Descrição opcional da organização. |
| `status` | `StatusOrganizacao` | - | Não | `PENDENTE` | Situação atual da organização. |
| `criada_por` | `ObjectId` | FK | Não | - | Referência ao usuário que cadastrou a organização. |
| `criado_em` | `Date` | - | Não | Automático | Data e hora de criação da organização. |
| `atualizado_em` | `Date` | - | Não | Automático | Data e hora da última atualização. |

### Chave estrangeira

```text
organizacao.criada_por → usuario._id
```

### Restrições

- O nome deve possuir entre 2 e 100 caracteres.
- A descrição pode possuir até 200 caracteres.
- A aplicação verifica se já existe outra organização com o mesmo nome.
- A organização inicia com status `PENDENTE`.
- Somente organizações com status `APROVADA` permitem solicitações de acesso e gestão de membros.

> A unicidade do nome da organização é tratada pela aplicação. O schema atual não define o campo `nome` como índice `unique`.

---

# 3. Tabela `membro_organizacao`

Representa o relacionamento entre um usuário e uma organização.

| Campo | Tipo | Chave | Nulo | Default | Descrição |
|---|---|---|---|---|---|
| `organizacao_id` | `ObjectId` | PK, FK | Não | - | Identificador da organização relacionada ao vínculo. |
| `usuario_id` | `ObjectId` | PK, FK | Não | - | Identificador do usuário relacionado à organização. |
| `papel` | `PapelOrganizacao` | - | Não | - | Define o papel do usuário dentro da organização. |
| `status` | `StatusMembroOrganizacao` | - | Não | `PENDENTE` | Situação do vínculo ou solicitação de acesso. |
| `solicitado_em` | `Date` | - | Não | Data atual | Data e hora de criação da solicitação ou vínculo. |
| `aprovado_em` | `Date` | - | Sim | `NULL` | Data e hora em que o vínculo foi aprovado. |

### Chave primária composta

A identificação lógica de um vínculo é formada por:

```text
(organizacao_id, usuario_id)
```

Isso representa a regra de que um usuário deve possuir apenas um vínculo com cada organização.

### Chaves estrangeiras

```text
membro_organizacao.organizacao_id → organizacao._id
membro_organizacao.usuario_id → usuario._id
```

### Restrições

- O usuário relacionado deve existir e estar ativo.
- A organização deve existir.
- Novas solicitações de acesso só podem ser realizadas em organizações com status `APROVADA`.
- Uma nova solicitação é criada com:
  - `papel = MEMBRO`
  - `status = PENDENTE`
- Apenas vínculos `PENDENTE` podem ser aprovados ou rejeitados.
- Apenas membros com papel `MEMBRO` e status `APROVADO` podem ser removidos pelo administrador da organização.
- Usuários com papel `ADMIN` não podem ser removidos pela operação comum de remoção de membros.

---

# 4. Domínio `TipoUsuario`

| Valor | Descrição |
|---|---|
| `USUARIO` | Usuário comum da plataforma. |
| `ADMIN_SISTEMA` | Administrador global da plataforma. |

> O administrador de uma organização não é identificado por `ADMIN_SISTEMA`. A administração de uma organização é determinada pelo vínculo em `membro_organizacao`.

---

# 5. Domínio `TemaUsuario`

| Valor | Descrição |
|---|---|
| `claro` | Interface em tema claro. |
| `escuro` | Interface em tema escuro. |
| `sistema` | Utiliza o tema definido pelo sistema operacional. |

---

# 6. Domínio `StatusOrganizacao`

| Valor | Descrição |
|---|---|
| `PENDENTE` | Organização aguardando aprovação. |
| `APROVADA` | Organização ativa e disponível para solicitações e gestão de membros. |
| `REVOGADA` | Organização desativada e indisponível para novas solicitações ou gestão de membros. |

---

# 7. Domínio `PapelOrganizacao`

| Valor | Descrição |
|---|---|
| `ADMIN` | Administrador da organização. |
| `MEMBRO` | Usuário comum vinculado ou solicitando acesso à organização. |

Para ser considerado administrador ativo da organização, o vínculo deve possuir:

```text
papel = ADMIN
status = APROVADO
```

---

# 8. Domínio `StatusMembroOrganizacao`

| Valor | Descrição |
|---|---|
| `PENDENTE` | Solicitação aguardando análise do administrador. |
| `APROVADO` | Usuário autorizado a participar da organização. |
| `REJEITADO` | Solicitação recusada pelo administrador da organização. |

### Transições permitidas

```text
PENDENTE ──────> APROVADO
    │
    └──────────> REJEITADO

APROVADO ──────> REMOVIDO
```

`REMOVIDO` não é um valor armazenado no campo `status`. Ele representa a exclusão do vínculo do usuário com a organização.

Na implementação atual, um vínculo com status `REJEITADO` continua armazenado. Enquanto esse vínculo existir, uma nova solicitação do mesmo usuário para a mesma organização não pode ser criada.

---

# 9. Relacionamentos

| Entidade de Origem | Cardinalidade | Entidade de Destino | Descrição |
|---|---|---|---|
| `usuario` | 1 : N | `organizacao` | Um usuário pode estar relacionado ao cadastro de várias organizações. |
| `usuario` | 1 : N | `membro_organizacao` | Um usuário pode possuir vínculos com várias organizações. |
| `organizacao` | 1 : N | `membro_organizacao` | Uma organização pode possuir vários vínculos de usuários. |

A relação entre usuários e organizações por participação é, conceitualmente, **N:M**, sendo resolvida pela entidade associativa:

```text
membro_organizacao
```

---

# 10. Correspondência entre o Modelo Relacional e o MongoDB

| Modelo Relacional | Implementação MongoDB |
|---|---|
| `usuario` | Coleção `usuarios` |
| `organizacao` | Coleção `organizacoes` |
| `membro_organizacao` | Array `organizacoes.membros[]` |
| `usuario._id` | `ObjectId` do documento do usuário |
| `organizacao._id` | `ObjectId` do documento da organização |
| `organizacao.criada_por` | Referência `ObjectId` para `Usuario` |
| `membro_organizacao.usuario_id` | Referência `ObjectId` para `Usuario` |
| `membro_organizacao.organizacao_id` | Implícito por estar dentro do documento `Organizacao` |

O modelo relacional deste documento é utilizado para representar de forma explícita as relações existentes no banco MongoDB utilizado pelo Conecta+.