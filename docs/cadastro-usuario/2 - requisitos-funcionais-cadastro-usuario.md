# Especificação de Requisitos Funcionais - Cadastro e Gestão de Usuários

---

## RF-01 - Cadastrar-se na plataforma

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Cadastrar-se na plataforma |
| **ID do Requisito (RF)** | RF-01 |
| **Ator Principal** | Usuário Não Autenticado |
| **Objetivo** | Permitir que um novo usuário crie uma conta na plataforma Conecta+ informando seus dados pessoais e credenciais de acesso. |
| **Prioridade** | Alta |
| **Pré-Condições** | O usuário não deve estar autenticado e o e-mail informado não deve estar cadastrado na plataforma. |
| **Pós-Condições** | A conta do usuário é criada com sucesso e fica disponível para autenticação na plataforma. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O usuário acessa a tela de cadastro.<br>2. O sistema exibe os campos nome, e-mail, senha e confirmação de senha.<br>3. O usuário preenche os campos solicitados.<br>4. O usuário confirma o cadastro.<br>5. O sistema valida os dados informados.<br>6. O sistema cria a conta do usuário.<br>7. O sistema informa que o cadastro foi realizado com sucesso.<br>8. O usuário é direcionado para a tela de login. |
| **Fluxos Alternativos** | Não se aplica. |
| **Fluxos de Exceção** | **FE-01: E-mail já cadastrado**<br>1. O sistema identifica que o e-mail já pertence a outro usuário.<br>2. O sistema informa que já existe uma conta cadastrada com o e-mail.<br>3. O cadastro não é realizado.<br><br>**FE-02: Dados inválidos**<br>1. O sistema identifica campos inválidos ou não preenchidos corretamente.<br>2. O sistema informa os campos que devem ser corrigidos.<br>3. O usuário pode corrigir os dados e tentar novamente. |

---

## RF-02 - Visualizar organizações disponíveis

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Visualizar organizações disponíveis |
| **ID do Requisito (RF)** | RF-02 |
| **Ator Principal** | Usuário Comum |
| **Objetivo** | Permitir que o usuário consulte as organizações aprovadas disponíveis para solicitação de acesso. |
| **Prioridade** | Alta |
| **Pré-Condições** | O usuário deve estar autenticado e com a conta ativa na plataforma. |
| **Pós-Condições** | As organizações disponíveis para solicitação de acesso são apresentadas ao usuário. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O usuário acessa a opção de participar de uma organização.<br>2. O sistema consulta as organizações disponíveis.<br>3. O sistema identifica as organizações aprovadas nas quais o usuário ainda não possui vínculo.<br>4. O sistema apresenta ao usuário a lista de organizações disponíveis.<br>5. Para cada organização, são exibidos seu nome e sua descrição, quando disponível. |
| **Fluxos Alternativos** | **FA-01: Nenhuma organização disponível**<br>1. O sistema não encontra organizações disponíveis para o usuário.<br>2. O sistema apresenta uma mensagem informando que não existem novas organizações disponíveis para participação. |
| **Fluxos de Exceção** | **FE-01: Falha ao consultar organizações**<br>1. O sistema não consegue carregar as organizações.<br>2. O sistema informa ao usuário que não foi possível concluir a consulta. |

---

## RF-03 - Solicitar acesso à organização

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Solicitar acesso à organização |
| **ID do Requisito (RF)** | RF-03 |
| **Ator Principal** | Usuário Comum |
| **Objetivo** | Permitir que um usuário solicite participação em uma organização aprovada. |
| **Prioridade** | Alta |
| **Pré-Condições** | O usuário deve estar autenticado e ativo.<br>A organização deve estar aprovada.<br>O usuário não deve possuir vínculo anterior com a organização. |
| **Pós-Condições** | Uma solicitação de acesso é registrada com status pendente e fica disponível para análise pelo administrador da organização. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O usuário visualiza as organizações disponíveis.<br>2. O usuário seleciona a opção "Pedir para participar" em uma organização.<br>3. O sistema verifica se a organização está disponível para receber solicitações.<br>4. O sistema verifica se o usuário ainda não possui vínculo com a organização.<br>5. O sistema registra a solicitação com status pendente.<br>6. O sistema informa que a solicitação foi enviada com sucesso.<br>7. A organização passa a ser apresentada ao usuário entre suas solicitações pendentes. |
| **Fluxos Alternativos** | Não se aplica. |
| **Fluxos de Exceção** | **FE-01: Organização indisponível**<br>1. A organização não existe ou deixou de estar aprovada.<br>2. O sistema não registra a solicitação e informa que a organização não está disponível.<br><br>**FE-02: Vínculo já existente**<br>1. O sistema identifica que o usuário já possui vínculo ou solicitação registrada para a organização.<br>2. Uma nova solicitação não é criada.<br>3. O sistema informa que o usuário já pertence ou possui solicitação para aquela organização. |

---

## RF-04 - Acompanhar status da solicitação

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Acompanhar status da solicitação |
| **ID do Requisito (RF)** | RF-04 |
| **Ator Principal** | Usuário Comum |
| **Objetivo** | Permitir que o usuário acompanhe a situação de suas solicitações de acesso às organizações. |
| **Prioridade** | Alta |
| **Pré-Condições** | O usuário deve estar autenticado e possuir pelo menos uma solicitação ou vínculo registrado com uma organização. |
| **Pós-Condições** | O usuário visualiza a situação atual de suas solicitações de acesso. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O usuário acessa a tela de participação em organizações.<br>2. O sistema consulta os vínculos do usuário com as organizações.<br>3. O sistema separa as solicitações de acordo com sua situação.<br>4. O usuário acessa a opção de solicitações pendentes ou recusadas.<br>5. O sistema apresenta as organizações correspondentes ao status selecionado. |
| **Fluxos Alternativos** | **FA-01: Solicitação aprovada**<br>1. O administrador aprova a solicitação do usuário.<br>2. A organização deixa de aparecer entre as solicitações pendentes ou recusadas.<br>3. O vínculo do usuário com a organização passa a estar aprovado e o acesso correspondente é liberado. |
| **Fluxos de Exceção** | **FE-01: Falha ao consultar solicitações**<br>1. O sistema não consegue obter as informações das organizações e vínculos.<br>2. O sistema informa que não foi possível carregar as solicitações. |

---

## RF-05 - Visualizar solicitações pendentes

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Visualizar solicitações pendentes |
| **ID do Requisito (RF)** | RF-05 |
| **Ator Principal** | Admin da Organização |
| **Objetivo** | Permitir que o administrador visualize os usuários que solicitaram acesso à organização e aguardam análise. |
| **Prioridade** | Alta |
| **Pré-Condições** | O administrador deve estar autenticado.<br>O administrador deve possuir vínculo aprovado com papel de administrador na organização.<br>A organização deve estar aprovada. |
| **Pós-Condições** | A lista de solicitações pendentes da organização é apresentada ao administrador. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O administrador acessa a opção de membros da organização.<br>2. O sistema apresenta as organizações aprovadas administradas pelo usuário.<br>3. O administrador seleciona uma organização.<br>4. O sistema consulta os membros e solicitações da organização.<br>5. O sistema identifica os usuários com solicitação pendente.<br>6. O sistema apresenta os usuários que aguardam análise.<br>7. Para cada solicitação são disponibilizadas as opções de aprovar ou rejeitar. |
| **Fluxos Alternativos** | **FA-01: Nenhuma solicitação pendente**<br>1. Não existem solicitações aguardando análise.<br>2. O sistema informa que não há solicitações pendentes.<br><br>**FA-02: Nenhuma organização administrada**<br>1. O usuário não administra nenhuma organização aprovada.<br>2. O sistema apresenta uma mensagem informativa. |
| **Fluxos de Exceção** | **FE-01: Acesso não autorizado**<br>1. O usuário não possui permissão de administrador na organização selecionada.<br>2. O sistema bloqueia o acesso às informações de membros e solicitações. |

---

## RF-06 - Aprovar solicitação de acesso

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Aprovar solicitação de acesso |
| **ID do Requisito (RF)** | RF-06 |
| **Ator Principal** | Admin da Organização |
| **Objetivo** | Permitir que o administrador autorize o ingresso de um usuário na organização. |
| **Prioridade** | Alta |
| **Pré-Condições** | O administrador deve estar autenticado e possuir permissão de administração na organização.<br>A organização deve estar aprovada.<br>A solicitação do usuário deve estar com status pendente. |
| **Pós-Condições** | A solicitação passa para o status aprovado e o usuário passa a possuir acesso à organização. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O administrador visualiza as solicitações pendentes da organização.<br>2. O administrador seleciona a opção de aprovar uma solicitação.<br>3. O sistema verifica se a solicitação ainda está pendente.<br>4. O sistema verifica as permissões do administrador.<br>5. O sistema altera o status da solicitação para aprovado.<br>6. O sistema registra a aprovação.<br>7. O usuário passa a constar entre os membros aprovados da organização.<br>8. O sistema apresenta uma confirmação da operação ao administrador. |
| **Fluxos Alternativos** | Não se aplica. |
| **Fluxos de Exceção** | **FE-01: Solicitação já analisada**<br>1. O sistema identifica que a solicitação não está mais pendente.<br>2. A aprovação não é realizada.<br>3. O sistema solicita a atualização da lista.<br><br>**FE-02: Administrador sem permissão**<br>1. O sistema identifica que o usuário não possui mais permissão para administrar a organização.<br>2. A aprovação é cancelada e o acesso é negado. |

---

## RF-07 - Rejeitar solicitação de acesso

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Rejeitar solicitação de acesso |
| **ID do Requisito (RF)** | RF-07 |
| **Ator Principal** | Admin da Organização |
| **Objetivo** | Permitir que o administrador rejeite uma solicitação de ingresso na organização. |
| **Prioridade** | Alta |
| **Pré-Condições** | O administrador deve estar autenticado e possuir permissão de administração na organização.<br>A organização deve estar aprovada.<br>A solicitação do usuário deve estar com status pendente. |
| **Pós-Condições** | A solicitação passa para o status rejeitado e o usuário não recebe acesso à organização. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O administrador visualiza as solicitações pendentes da organização.<br>2. O administrador seleciona a opção de rejeitar uma solicitação.<br>3. O sistema verifica se a solicitação ainda está pendente.<br>4. O sistema verifica as permissões do administrador.<br>5. O sistema altera o status da solicitação para rejeitado.<br>6. O sistema apresenta uma confirmação da operação ao administrador.<br>7. A solicitação passa a ser apresentada ao usuário como recusada. |
| **Fluxos Alternativos** | Não se aplica. |
| **Fluxos de Exceção** | **FE-01: Solicitação já analisada**<br>1. O sistema identifica que a solicitação não está mais pendente.<br>2. A rejeição não é realizada.<br>3. O sistema solicita a atualização da lista.<br><br>**FE-02: Administrador sem permissão**<br>1. O sistema identifica que o usuário não possui mais permissão para administrar a organização.<br>2. A operação é cancelada e o acesso é negado. |

---

## RF-08 - Visualizar membros da organização

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Visualizar membros da organização |
| **ID do Requisito (RF)** | RF-08 |
| **Ator Principal** | Admin da Organização |
| **Objetivo** | Permitir que o administrador consulte os usuários que possuem acesso aprovado à organização. |
| **Prioridade** | Alta |
| **Pré-Condições** | O administrador deve estar autenticado.<br>O administrador deve possuir vínculo aprovado com papel de administrador na organização.<br>A organização deve estar aprovada. |
| **Pós-Condições** | A lista de membros aprovados da organização é apresentada ao administrador. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O administrador acessa a opção de membros da organização.<br>2. O administrador seleciona a organização que deseja gerenciar.<br>3. O sistema consulta os membros da organização.<br>4. O sistema identifica os membros com acesso aprovado.<br>5. O sistema apresenta nome, e-mail e papel de cada membro.<br>6. Os administradores são apresentados antes dos membros comuns.<br>7. Para membros comuns, o sistema disponibiliza a opção de remoção de acesso. |
| **Fluxos Alternativos** | **FA-01: Nenhum membro aprovado**<br>1. Não existem membros aprovados para apresentação.<br>2. O sistema informa que não há membros aprovados na organização. |
| **Fluxos de Exceção** | **FE-01: Acesso não autorizado**<br>1. O usuário não possui permissão para administrar a organização.<br>2. O sistema bloqueia a consulta dos membros. |

---

## RF-09 - Remover membro da organização

| Campo | Descrição |
|---|---|
| **Nome do Caso de Uso** | Remover membro da organização |
| **ID do Requisito (RF)** | RF-09 |
| **Ator Principal** | Admin da Organização |
| **Objetivo** | Permitir que o administrador remova o acesso de um membro aprovado da organização. |
| **Prioridade** | Alta |
| **Pré-Condições** | O administrador deve estar autenticado e possuir permissão de administração na organização.<br>A organização deve estar aprovada.<br>O usuário a ser removido deve possuir papel de membro e status aprovado. |
| **Pós-Condições** | O vínculo do membro com a organização é removido.<br>O usuário deixa de possuir acesso à organização e às comissões vinculadas a ela.<br>A conta do usuário e seus vínculos com outras organizações permanecem inalterados. |
| **Fluxo Principal (Caminho de Sucesso)** | 1. O administrador visualiza os membros aprovados da organização.<br>2. O administrador seleciona a opção de remover acesso de um membro.<br>3. O sistema apresenta uma confirmação da operação.<br>4. O administrador confirma a remoção.<br>5. O sistema verifica as permissões do administrador e a situação do membro.<br>6. O sistema remove o vínculo do membro com a organização.<br>7. O sistema remove o membro das comissões pertencentes à organização.<br>8. O sistema atualiza a lista de membros.<br>9. O sistema informa que o acesso foi removido com sucesso. |
| **Fluxos Alternativos** | **FA-01: Cancelamento da remoção**<br>1. O administrador seleciona a opção de remover um membro.<br>2. O sistema solicita confirmação.<br>3. O administrador cancela a operação.<br>4. Nenhuma alteração é realizada. |
| **Fluxos de Exceção** | **FE-01: Tentativa de remover administrador**<br>1. O administrador tenta remover um usuário que possui papel de administrador.<br>2. O sistema bloqueia a operação.<br>3. O sistema informa que administradores não podem ser removidos dessa forma.<br><br>**FE-02: Membro sem status aprovado**<br>1. O sistema identifica que o usuário não é um membro aprovado.<br>2. A remoção não é realizada.<br><br>**FE-03: Permissões ou vínculo alterados**<br>1. As permissões do administrador ou o vínculo do membro são alterados durante a operação.<br>2. O sistema cancela a remoção e solicita a atualização das informações. |