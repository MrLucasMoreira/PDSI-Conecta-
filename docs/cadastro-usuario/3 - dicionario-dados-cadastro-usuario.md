# Dicionário de Dados - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Banco de Dados:** MongoDB com Mongoose ODM  
> **Versão:** 1.0

---

## 1. Classe `Usuario`

Representa uma conta de usuário cadastrada na plataforma.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `_id` | `ObjectId` | Sim | Identificador único do usuário, gerado pelo MongoDB. |
| `nome` | `String` | Sim | Nome do usuário. O valor é armazenado sem espaços desnecessários nas extremidades. |
| `email` | `String` | Sim | E-mail utilizado para identificação e autenticação do usuário. Deve ser único e é normalizado para letras minúsculas. |
| `senha_hash` | `String` | Sim | Hash da senha do usuário. A senha original não é armazenada. |
| `tipo` | `TipoUsuario` | Sim | Tipo global do usuário na plataforma. O valor padrão é `USUARIO`. |
| `tema` | `TemaUsuario` | Sim | Preferência de tema da interface. O valor padrão é `sistema`. |
| `ativo` | `Boolean` | Sim | Indica se a conta está ativa. O valor padrão é `true`. |
| `criado_em` | `Date` | Sim | Data e hora de criação da conta, preenchida automaticamente. |
| `atualizado_em` | `Date` | Sim | Data e hora da última atualização do usuário, preenchida automaticamente. |

### Regras relacionadas ao cadastro

O nome deve possuir pelo menos 2 caracteres.

O e-mail deve possuir formato válido e não pode estar associado a outro usuário.

A senha deve possuir pelo menos 8 caracteres.

A senha é armazenada utilizando hash bcrypt.

Todo usuário cadastrado normalmente recebe o tipo `USUARIO`.

---

## 2. Enum `TipoUsuario`

Define o perfil global de um usuário na plataforma.

| Valor | Descrição |
|---|---|
| `USUARIO` | Usuário comum da plataforma. Pode participar e administrar organizações conforme seus vínculos. |
| `ADMIN_SISTEMA` | Administrador global da plataforma. |

> O administrador de uma organização não é representado por `ADMIN_SISTEMA`. A administração de uma organização é definida pelo campo `papel` do vínculo `MembroOrganizacao`.

---

## 3. Enum `TemaUsuario`

Define a preferência visual do usuário.

| Valor armazenado | Descrição |
|---|---|
| `claro` | Utiliza o tema claro. |
| `escuro` | Utiliza o tema escuro. |
| `sistema` | Utiliza a preferência definida pelo sistema operacional. É o valor padrão. |

---

## 4. Classe `Organizacao`

Representa uma organização cadastrada na plataforma.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `_id` | `ObjectId` | Sim | Identificador único da organização, gerado pelo MongoDB. |
| `nome` | `String` | Sim | Nome da organização. |
| `descricao` | `String` | Não | Descrição opcional da organização. |
| `status` | `StatusOrganizacao` | Sim | Situação atual da organização. O valor padrão é `PENDENTE`. |
| `criada_por` | `ObjectId` | Sim | Referência ao usuário que cadastrou a organização. |
| `membros` | `MembroOrganizacao[]` | Sim | Lista de vínculos entre usuários e a organização. |
| `criado_em` | `Date` | Sim | Data e hora de criação da organização. |
| `atualizado_em` | `Date` | Sim | Data e hora da última atualização da organização. |

### Regras relacionadas à organização

O nome informado na criação deve possuir entre 2 e 100 caracteres.

A descrição, quando informada, pode possuir no máximo 200 caracteres.

A aplicação verifica se já existe uma organização com o mesmo nome, desconsiderando diferenças entre letras maiúsculas e minúsculas.

Somente organizações com status `APROVADA` podem receber solicitações de acesso e permitir a gestão de membros.

---

## 5. Enum `StatusOrganizacao`

Define a situação de uma organização na plataforma.

| Valor | Descrição |
|---|---|
| `PENDENTE` | Organização cadastrada e aguardando aprovação. |
| `APROVADA` | Organização ativa e disponível para solicitações de acesso e gestão de membros. |
| `REVOGADA` | Organização com autorização revogada e indisponível para novas solicitações ou gestão de membros. |

Para o incremento de cadastro e gestão de usuários, as operações de solicitação e administração de membros são realizadas somente quando a organização está com status `APROVADA`.

---

## 6. Classe `MembroOrganizacao`

Representa o vínculo de um usuário com uma organização.

Essa estrutura é armazenada como um subdocumento dentro do array `membros` da organização.

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---:|---|
| `usuario_id` | `ObjectId` | Sim | Referência ao usuário relacionado à organização. |
| `papel` | `PapelOrganizacao` | Sim | Define se o usuário é administrador ou membro da organização. |
| `status` | `StatusMembroOrganizacao` | Sim | Situação do vínculo do usuário com a organização. O valor padrão é `PENDENTE`. |
| `solicitado_em` | `Date` | Sim | Data e hora em que o vínculo ou solicitação foi criado. |
| `aprovado_em` | `Date` | Não | Data e hora em que a solicitação foi aprovada. |

### Funcionamento do vínculo

Quando um usuário solicita acesso a uma organização, é criado um vínculo com:

```text
papel = MEMBRO
status = PENDENTE
```

Quando o administrador da organização aprova a solicitação:

```text
status = APROVADO
aprovado_em = data da aprovação
```

Quando o administrador rejeita a solicitação:

```text
status = REJEITADO
```

Quando um membro aprovado é removido da organização, seu vínculo é removido do array `membros`.

Um vínculo com status `REJEITADO` permanece registrado na implementação atual. Portanto, o usuário não consegue criar uma nova solicitação para a mesma organização enquanto esse vínculo existir.

---

## 7. Enum `PapelOrganizacao`

Define a função do usuário dentro de uma organização.

| Valor | Descrição |
|---|---|
| `ADMIN` | Administrador da organização. Pode visualizar solicitações, aprovar ou rejeitar acessos e gerenciar membros. |
| `MEMBRO` | Usuário comum que solicita ou possui acesso à organização. |

Para um usuário ser considerado administrador da organização, seu vínculo deve possuir:

```text
papel = ADMIN
status = APROVADO
```

---

## 8. Enum `StatusMembroOrganizacao`

Define a situação do vínculo entre um usuário e uma organização.

| Valor | Descrição |
|---|---|
| `PENDENTE` | Solicitação aguardando análise pelo administrador da organização. |
| `APROVADO` | Usuário autorizado a participar da organização. |
| `REJEITADO` | Solicitação de acesso recusada pelo administrador. |

### Transições de estado

```text
                      ┌──> APROVADO ──> REMOVIDO
                      │
PENDENTE ─────────────┤
                      │
                      └──> REJEITADO
```

Somente solicitações com status `PENDENTE` podem ser aprovadas ou rejeitadas.

Um membro com status `APROVADO` e papel `MEMBRO` pode ser removido pelo administrador da organização.

Administradores da organização não podem ser removidos por meio da operação normal de remoção de membros.

---

## 9. Relacionamentos

### `Usuario` e `Organizacao`

Um usuário pode ser responsável pelo cadastro de nenhuma, uma ou várias organizações.

```text
Usuario 1 -------- 0..* Organizacao
```

A referência é armazenada em:

```text
Organizacao.criada_por
```

### `Usuario` e `MembroOrganizacao`

Um usuário pode possuir vínculos com várias organizações.

```text
Usuario 1 -------- 0..* MembroOrganizacao
```

A referência ao usuário é armazenada em:

```text
MembroOrganizacao.usuario_id
```

### `Organizacao` e `MembroOrganizacao`

Uma organização pode possuir vários vínculos de usuários.

```text
Organizacao 1 ◼------ 0..* MembroOrganizacao
```

`MembroOrganizacao` é um subdocumento embutido dentro de `Organizacao`. Portanto, ele não constitui uma coleção independente no MongoDB.

---

## 10. Correspondência com o Incremento

| Funcionalidade do Incremento | Classes Envolvidas |
|---|---|
| Cadastro de usuário | `Usuario` |
| Visualização de organizações disponíveis | `Usuario`, `Organizacao`, `MembroOrganizacao` |
| Solicitação de acesso | `Usuario`, `Organizacao`, `MembroOrganizacao` |
| Acompanhamento da solicitação | `Organizacao`, `MembroOrganizacao` |
| Visualização de solicitações pendentes | `Usuario`, `Organizacao`, `MembroOrganizacao` |
| Aprovação ou rejeição de acesso | `Organizacao`, `MembroOrganizacao` |
| Visualização de membros | `Usuario`, `Organizacao`, `MembroOrganizacao` |
| Remoção de membro | `Organizacao`, `MembroOrganizacao` |