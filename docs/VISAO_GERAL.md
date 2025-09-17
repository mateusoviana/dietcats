# DietCats - Visão Geral do Projeto

## 1. Visão Geral do Projeto

**DietCats** é um aplicativo mobile multiplataforma (Android e iOS) com foco em gamificação para aumentar o engajamento de usuários no cumprimento de suas dietas. O sistema servirá como uma ferramenta de automonitoramento para pacientes e de acompanhamento para nutricionistas.

A inspiração para a interface e a experiência do usuário vem do aplicativo GymRats, buscando transformar a adesão a planos alimentares em uma jornada mais interativa, social e motivadora.

- **Público-alvo:** Nutricionistas e seus pacientes interessados em automonitoramento de dietas.
- **Plataformas:** O aplicativo deve ser desenvolvido para Android e iOS.
- **Nome do Projeto:** DietCats.

## 2. Perfis de Usuário

O sistema possui dois perfis de usuário distintos com funcionalidades específicas:

- **Usuário Normal (Paciente):** Indivíduo seguindo um plano alimentar. Usa o app para registrar refeições, acompanhar o progresso e participar de competições.
- **Nutricionista:** Profissional de saúde que acompanha múltiplos pacientes. Usa o app para monitorar a adesão, analisar dados agregados e criar competições para engajamento.

## 3. Requisitos Funcionais (Escopo da v1)

Abaixo estão as funcionalidades essenciais que devem ser implementadas na estrutura inicial do projeto.

### 3.1. Funcionalidades do Paciente (Usuário Normal)

- **Autenticação e Perfil:**
  - O usuário deve poder se autenticar no sistema.
  - Deve existir uma tela de perfil onde o usuário possa configurar seu nome de exibição, foto (opcional) e, crucialmente, os **nomes e horários de suas refeições diárias** (ex: Café da Manhã - 08:00, Almoço - 12:30).
  - O usuário deve poder gerenciar suas preferências de notificação.
- **Check-in de Refeição:**
  - Funcionalidade principal para o paciente registrar uma refeição.
  - A tela de check-in deve conter os seguintes campos:
    - Foto da refeição (opcional).
    - Título e tipo da refeição (configurável pelo usuário no perfil).
    - Avaliações em escala de 1 a 5 para: **fome, saciedade e satisfação**.
    - Campo para adicionar uma "tag" personalizável (ex: 'saudável', 'cheat meal').
    - Campo de observações em texto livre (opcional).
- **Histórico de Refeições:**
  - Uma tela para visualizar o histórico cronológico de todos os check-ins realizados.
  - Deve permitir a filtragem por período (dia, semana, mês).
- **Competições:**
  - O usuário deve poder visualizar e participar de competições criadas por seu nutricionista.
  - Deve existir um "feed da competição" onde os check-ins dos participantes são exibidos.
- **Associação com Nutricionista:**
  - O paciente deve poder se associar a um nutricionista inserindo um código de associação fornecido pelo profissional.

### 3.2. Funcionalidades do Nutricionista

- **Autenticação e Gestão de Pacientes:**
  - O nutricionista deve poder se autenticar no sistema.
  - Deve ter uma tela inicial que lista todos os seus pacientes associados.
  - Deve poder gerar um código de associação para convidar novos pacientes.
  - Deve poder remover a associação com um paciente.
- **Dashboard por Paciente:**
  - Ao selecionar um paciente, o nutricionista acessa um dashboard com dados agregados sobre a adesão à dieta.
  - O dashboard deve exibir:
    - Visão de refeições previstas vs. realizadas, faltas e excessos.
    - Gráficos com a distribuição de tags e as médias das autoavaliações (fome, saciedade, satisfação).
    - Permitir a seleção de período para análise (semanal, mensal).
- **Criação e Gestão de Competições:**
  - O nutricionista deve poder criar competições para seus pacientes.
  - A criação de uma competição deve incluir: nome, período de duração e critérios de pontuação.
  - O nutricionista deve selecionar quais pacientes irão participar.

### 3.3. Funcionalidades Gerais

- **Notificações:**
  - O aplicativo deve enviar notificações (lembretes) para o paciente nos horários de refeição que ele configurou em seu perfil.

## 4. Requisitos Não Funcionais Chave

- **Interface:** A UI deve ser gamificada, intuitiva e de fácil uso. Ações comuns, como o check-in, devem exigir no máximo 2-3 toques.
- **Desempenho:**
  - Salvar um check-in: < 2 segundos em rede estável.
  - Carregar histórico/dashboard: < 3 segundos.
- **Segurança:** Todas as comunicações com o servidor devem usar HTTPS para garantir a privacidade dos dados, em conformidade com a LGPD.
- **Confiabilidade:** O aplicativo depende de conexão com a internet. Mensagens de erro claras devem ser exibidas em caso de falha de rede.

## 5. Escopo Negativo (Fora da v1)

Para o commit inicial, as seguintes funcionalidades **NÃO** devem ser consideradas:

- Sem prescrição de plano alimentar diretamente no app.
- Sem chat em tempo real entre usuários ou com o nutricionista.
- Sem contagem automática de calorias ou macronutrientes.
- Sem integração com prontuários eletrônicos ou outros sistemas de saúde.
- Sem exportação de relatórios (funcionalidade desejável para v2).

