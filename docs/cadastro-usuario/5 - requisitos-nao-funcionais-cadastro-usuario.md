# Requisitos Não Funcionais - Cadastro e Gestão de Usuários

> **Projeto:** Conecta+  
> **Incremento:** Cadastro de Usuário, Solicitação de Acesso e Gestão de Membros  
> **Versão:** 1.0

---

## Visão Geral

Os requisitos não funcionais abaixo definem critérios de qualidade, segurança, desempenho, confiabilidade e usabilidade relacionados às funcionalidades deste incremento.

| Código | Categoria | Requisito | Prioridade |
|---|---|---|---|
| RNF-01 | Desempenho | As operações do incremento devem responder em tempo adequado ao usuário. | Alta |
| RNF-02 | Segurança | As senhas dos usuários devem ser armazenadas de forma segura. | Crítica |
| RNF-03 | Segurança | O acesso às funcionalidades protegidas deve exigir autenticação e autorização. | Crítica |
| RNF-04 | Validação | Os dados informados pelo usuário devem ser validados no frontend e no backend. | Alta |
| RNF-05 | Confiabilidade | Operações de aprovação, rejeição e remoção devem preservar a integridade dos dados. | Alta |
| RNF-06 | Usabilidade | O sistema deve fornecer feedback claro sobre o resultado das operações. | Alta |
| RNF-07 | Privacidade | Dados sensíveis do usuário não devem ser expostos desnecessariamente. | Crítica |
| RNF-08 | Acessibilidade | Os principais elementos de interação devem possuir informações de acessibilidade. | Média |
| RNF-09 | Manutenibilidade | O código do incremento deve utilizar tipagem e validação consistentes. | Média |

---

# RNF-01 - Desempenho

| Campo | Descrição |
|---|---|
| **Categoria** | Desempenho |
| **Descrição** | As operações de cadastro, consulta de organizações, solicitação de acesso e gestão de membros devem apresentar resposta ao usuário em até 2 segundos em condições normais de utilização. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Alta |

O requisito se aplica principalmente às operações de:

- cadastro de usuário;
- consulta de organizações;
- envio de solicitação de acesso;
- consulta de solicitações;
- aprovação e rejeição de solicitações;
- consulta e remoção de membros.

---

# RNF-02 - Proteção das Senhas

| Campo | Descrição |
|---|---|
| **Categoria** | Segurança |
| **Descrição** | As senhas dos usuários não devem ser armazenadas em texto puro. O sistema deve armazenar somente o hash da senha. |
| **Aplicação** | RF-01 - Cadastrar-se na plataforma |
| **Prioridade** | Crítica |

Na implementação atual, as senhas são processadas utilizando `bcrypt` com fator de custo 10.

O campo que contém o hash da senha não deve ser retornado em consultas comuns realizadas pela aplicação.

```text
Senha informada
      ↓
bcrypt
      ↓
senha_hash
      ↓
MongoDB
```

---

# RNF-03 - Autenticação e Autorização

| Campo | Descrição |
|---|---|
| **Categoria** | Segurança |
| **Descrição** | As funcionalidades que envolvem organizações e membros devem ser acessadas somente por usuários autenticados e ativos. Operações administrativas devem validar também a permissão do usuário dentro da organização. |
| **Aplicação** | RF-02 a RF-09 |
| **Prioridade** | Crítica |

Para acessar funcionalidades protegidas, o sistema deve verificar:

```text
Usuário autenticado
        ↓
Conta ativa
        ↓
Permissão necessária
```

Nas operações administrativas de uma organização, o usuário deve possuir vínculo com:

```text
papel = ADMIN
status = APROVADO
```

Dessa forma, um usuário comum não pode aprovar, rejeitar ou remover membros de uma organização que não administra.

---

# RNF-04 - Validação de Dados

| Campo | Descrição |
|---|---|
| **Categoria** | Confiabilidade / Usabilidade |
| **Descrição** | Os dados fornecidos pelos usuários devem ser validados antes de serem persistidos ou utilizados pelo sistema. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Alta |

A validação deve ocorrer tanto na interface quanto no backend.

Entre as validações utilizadas no incremento estão:

- nome obrigatório e com tamanho mínimo;
- e-mail em formato válido;
- e-mail único no cadastro;
- senha com pelo menos 8 caracteres;
- confirmação da senha no frontend;
- identificadores válidos;
- status permitidos para solicitações;
- verificação da existência de usuário e organização.

A validação no backend deve ser mantida mesmo quando o frontend já tenha validado os dados.

---

# RNF-05 - Integridade e Consistência dos Dados

| Campo | Descrição |
|---|---|
| **Categoria** | Confiabilidade |
| **Descrição** | O sistema deve preservar a consistência dos vínculos entre usuários e organizações durante solicitações e operações administrativas. |
| **Aplicação** | RF-03, RF-06, RF-07 e RF-09 |
| **Prioridade** | Alta |

O sistema deve garantir que:

- um usuário não possua mais de um vínculo com a mesma organização;
- somente solicitações com status `PENDENTE` possam ser aprovadas ou rejeitadas;
- somente administradores aprovados da organização possam analisar solicitações;
- somente membros aprovados possam ser removidos;
- administradores da organização não possam ser removidos pela operação comum de remoção de membros;
- alterações críticas de vínculo sejam realizadas de maneira consistente mesmo quando duas operações ocorrerem em um intervalo muito próximo.

Na implementação MongoDB, as alterações de status e remoções são realizadas utilizando operações atômicas no documento da organização.

---

# RNF-06 - Feedback ao Usuário

| Campo | Descrição |
|---|---|
| **Categoria** | Usabilidade |
| **Descrição** | O sistema deve informar claramente ao usuário o estado e o resultado das operações realizadas. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Alta |

A interface deve fornecer feedback para situações como:

- carregamento de dados;
- operação em andamento;
- cadastro realizado com sucesso;
- solicitação enviada;
- solicitação aprovada;
- solicitação rejeitada;
- membro removido;
- erro de validação;
- erro de comunicação;
- lista sem registros;
- operações destrutivas que necessitem confirmação.

Exemplo:

```text
Usuário solicita acesso
        ↓
Operação em andamento
        ↓
Solicitação registrada
        ↓
Mensagem de sucesso
```

---

# RNF-07 - Proteção de Dados do Usuário

| Campo | Descrição |
|---|---|
| **Categoria** | Segurança / Privacidade |
| **Descrição** | Informações sensíveis devem ser protegidas e somente os dados necessários para a funcionalidade devem ser apresentados aos usuários. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Crítica |

O sistema deve evitar a exposição de dados sensíveis, especialmente:

- senha original;
- hash da senha;
- informações internas de autenticação;
- dados de usuários que não sejam necessários para a operação executada.

A senha deve existir apenas durante seu processamento e não deve ser armazenada em texto puro.

Nas listagens de membros são apresentados somente os dados necessários para a identificação e administração do vínculo.

---

# RNF-08 - Acessibilidade da Interface

| Campo | Descrição |
|---|---|
| **Categoria** | Acessibilidade |
| **Descrição** | Os principais elementos interativos da interface devem fornecer informações adequadas para tecnologias assistivas. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Média |

Elementos como botões e ações importantes devem possuir descrições acessíveis sempre que necessário.

Exemplos:

```text
"Pedir para participar de [organização]"
"Remover acesso de [usuário]"
```

A interface também deve diferenciar visualmente situações como:

- pendente;
- aprovado;
- rejeitado;
- erro;
- sucesso.

---

# RNF-09 - Manutenibilidade e Qualidade do Código

| Campo | Descrição |
|---|---|
| **Categoria** | Manutenibilidade |
| **Descrição** | A implementação deve utilizar tipagem, validação e separação de responsabilidades para facilitar manutenção e evolução do sistema. |
| **Aplicação** | RF-01 a RF-09 |
| **Prioridade** | Média |

O projeto utiliza TypeScript com modo estrito, permitindo identificar inconsistências de tipo durante o desenvolvimento.

No backend, a aplicação utiliza DTOs e validação de entrada para controlar os dados recebidos.

As responsabilidades são separadas entre:

```text
Controller
    ↓
Service
    ↓
Model / MongoDB
```

No frontend, componentes reutilizáveis são utilizados para elementos como:

- botões;
- campos de entrada;
- mensagens;
- confirmações;
- estados de carregamento;
- estados vazios.

---

# Matriz de Aplicação dos Requisitos Não Funcionais

| Requisito Funcional | RNFs Principais |
|---|---|
| RF-01 - Cadastrar-se na plataforma | RNF-01, RNF-02, RNF-04, RNF-06, RNF-07, RNF-08, RNF-09 |
| RF-02 - Visualizar organizações disponíveis | RNF-01, RNF-03, RNF-04, RNF-06, RNF-07, RNF-08 |
| RF-03 - Solicitar acesso à organização | RNF-01, RNF-03, RNF-04, RNF-05, RNF-06, RNF-08 |
| RF-04 - Acompanhar status da solicitação | RNF-01, RNF-03, RNF-06, RNF-08 |
| RF-05 - Visualizar solicitações pendentes | RNF-01, RNF-03, RNF-06, RNF-07, RNF-08 |
| RF-06 - Aprovar solicitação de acesso | RNF-01, RNF-03, RNF-05, RNF-06, RNF-08 |
| RF-07 - Rejeitar solicitação de acesso | RNF-01, RNF-03, RNF-05, RNF-06, RNF-08 |
| RF-08 - Visualizar membros da organização | RNF-01, RNF-03, RNF-06, RNF-07, RNF-08 |
| RF-09 - Remover membro da organização | RNF-01, RNF-03, RNF-05, RNF-06, RNF-08 |

---

## Resumo

Os requisitos não funcionais definidos para este incremento concentram-se em cinco aspectos principais:

```text
Segurança
   │
   ├── proteção de senhas
   ├── autenticação
   ├── autorização
   └── proteção de dados

Confiabilidade
   │
   ├── validação
   └── integridade dos vínculos

Usabilidade
   │
   └── feedback das operações

Acessibilidade
   │
   └── elementos acessíveis

Manutenibilidade
   │
   └── tipagem e separação de responsabilidades
```