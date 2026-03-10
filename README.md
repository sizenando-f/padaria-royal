# Padaria Royal - Sistema de Gestão de Produção (MRP)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Sistema de gestão de produção e controle de qualidade desenvolvido para padarias. A aplicação permite registrar cada fornada de pão, avaliá-la com uma nota de qualidade e acompanhar o desempenho histórico via dashboard analítico. O diferencial técnico está no módulo de sugestão de dosagem de fermento, que aplica um algoritmo de similaridade ponderada sobre o histórico de fornadas bem-avaliadas para recomendar a quantidade ideal de fermento dado o cenário climático atual.

---

## Visão Geral

O ciclo de uso do sistema é simples: um padeiro registra os dados de uma fornada (ingredientes, temperaturas, horário), a fornada entra no sistema como pendente, e posteriormente ele ou outro operador atribui uma nota de qualidade. Esse ciclo gera um histórico estruturado que alimenta tanto o dashboard gerencial quanto o algoritmo de sugestão.

O sistema possui dois níveis de acesso — **Padeiro** e **Gerente** — com permissões distintas e regras de negócio aplicadas no backend, como a janela de edição de 3 dias e o bloqueio de login fora do horário de trabalho definido para cada usuário.

---

## Funcionalidades Principais

**Registro de fornadas**
Cada produção é registrada com os ingredientes utilizados (farinha em kg, fermento em gramas, emulsificante em ml), temperaturas ambiente (inicial e prevista para o fim), horário de início e fim, e observações livres. O tempo de fermentação é calculado automaticamente pelo backend a partir da diferença entre os dois horários.

**Avaliação de qualidade**
Após a produção, qualquer operador autorizado pode atribuir uma nota de 1 a 5 à fornada, com comentário opcional e registro da temperatura ambiente final real. Uma fornada só pode ser avaliada uma vez.

**Sugestão de dosagem por similaridade histórica**
O módulo mais sofisticado do sistema. Dado o cenário atual (temperatura ambiente, temperatura prevista ao fim da fermentação e tempo de fermentação desejado), o algoritmo seleciona as fornadas históricas mais similares e calcula uma sugestão de dosagem de fermento por média ponderada. O detalhamento do algoritmo está na seção específica abaixo.

**Integração meteorológica**
Ao iniciar o registro de uma fornada, o sistema consulta a API Open-Meteo para preencher automaticamente as temperaturas ambiente com base nas coordenadas geográficas configuradas e no horário informado.

**Dashboard analítico**
Painel com média geral de qualidade, distribuição das notas (gráfico de pizza), média mensal e histórico dos últimos 6 meses (gráfico de linha).

**Controle de acesso por perfil**
Cada usuário tem 5 permissões independentes: registrar, avaliar, ver histórico, editar e excluir. Gerentes têm acesso irrestrito; padeiros operam dentro das permissões e do horário definidos pelo gerente.

**Backup automático por e-mail**
O sistema envia um arquivo CSV com todos os dados de produção diariamente para um e-mail configurável pelo gerente.

**Importação e exportação de CSV**
O histórico completo pode ser exportado em formato CSV. Da mesma forma, dados históricos podem ser importados em lote via CSV, com processamento assíncrono em segundo plano para evitar timeout.

**Auditoria de exclusões**
Toda exclusão de fornada é registrada com o nome do responsável, o ID da produção e a data/hora. O gerente pode consultar esse log no painel administrativo.

---

## Algoritmo de Sugestão de Fermento

Este é o núcleo inteligente do sistema. O objetivo é responder à seguinte pergunta: *dado o clima de hoje e o tempo de fermentação desejado, quantos gramas de fermento devo usar por quilo de farinha?*

**Base de dados utilizada**
Apenas fornadas com nota 4 ou 5 (Bom ou Excelente) e com temperaturas registradas são consideradas. Isso garante que o modelo aprenda apenas com produções bem-sucedidas.

**Cálculo de distância**
Para cada fornada histórica, calcula-se uma distância em relação ao cenário atual usando a soma das diferenças absolutas de temperatura (inicial e final) mais a diferença de tempo de fermentação normalizada:

$$\text{distância} = |\text{tempIni}_{histórico} - \text{tempIni}_{atual}| + |\text{tempFim}_{histórico} - \text{tempFim}_{atual}| + \frac{|\text{tempo}_{histórico} - \text{tempo}_{alvo}|}{60}$$

Esse cálculo é equivalente a uma distância de Manhattan no espaço de variáveis climáticas e temporais.

**Ponderação inversa**
Cada fornada recebe um peso inversamente proporcional à sua distância:

$$\text{peso} = \frac{1}{\text{distância} + 0.1}$$

O valor `0.1` é adicionado para evitar divisão por zero no caso de fornadas com condições idênticas às atuais — nesse caso, o peso seria muito alto (próximo de 10), o que é desejável.

**Média ponderada da proporção fermento/farinha**
O sistema não trabalha com gramas absolutas, mas com a *proporção* `fermento / farinha` de cada fornada. A média ponderada dessas proporções é calculada e depois multiplicada pela quantidade de farinha atual:

$$\text{proporção média} = \frac{\sum_{i=1}^{n} (\text{proporção}_i \times \text{peso}_i)}{\sum_{i=1}^{n} \text{peso}_i}$$

$$\text{fermento sugerido} = \text{round}(\text{proporção média} \times \text{farinha atual})$$

Isso torna a sugestão independente do volume de produção — uma fornada pequena e uma grande com o mesmo clima geram proporções comparáveis.

**Fallback**
Caso nenhuma temperatura seja informada, os últimos 20 registros históricos recebem peso igual (média simples). Caso não haja nenhum histórico de qualidade, o sistema retorna uma mensagem explicativa sem sugestão numérica.

As 5 fornadas mais similares utilizadas no cálculo são devolvidas junto com a sugestão como "provas de trabalho", permitindo que o padeiro ou gerente verifique a origem da recomendação.

---

## Arquitetura

O projeto é um monorepo com dois serviços independentes e um banco de dados em contêiner.

```
padaria-royal/
├── backend/    # API REST em NestJS
├── frontend/   # Interface web em Next.js
└── docker-compose.yml
```

**Backend**
API REST construída com NestJS (Node.js), organizada em módulos por domínio: `producao`, `avaliacao`, `auth`, `usuario`, `admin`, `backup`. A camada de acesso a dados utiliza Prisma ORM sobre PostgreSQL. A autenticação é feita via JWT com senhas armazenadas com bcrypt. Tarefas agendadas (backup diário) são gerenciadas pelo módulo `@nestjs/schedule`.

**Frontend**
Interface web construída com Next.js (App Router) e React 19. A estilização usa Tailwind CSS e os gráficos são renderizados com Recharts. O gerenciamento de sessão é feito via React Context, com o token JWT armazenado no `localStorage`.

**Banco de dados**
PostgreSQL 15 gerenciado pelo Docker. O schema é versionado via migrations do Prisma.

---

## Modelo de Dados

**Producao** — representa uma fornada individual com todos os seus parâmetros técnicos: quantidades de farinha, fermento e emulsificante; temperaturas ambiente inicial e final (prevista); horário de início e fim; e tempo de fermentação calculado em minutos.

**Avaliacao** — ligada a uma única produção (relação 1:1 com exclusão em cascata). Armazena a nota (1–5), um comentário opcional e a temperatura ambiente final real medida no momento da avaliação.

**Usuario** — contém credenciais, cargo (`GERENTE` ou `PADEIRO`), as 5 permissões booleanas independentes e os campos de horário permitido de acesso.

**LogExclusao** — registro imutável de cada exclusão de fornada, com nome do responsável, ID da produção excluída e timestamp.

**Configuracao** — tabela de chave-valor para configurações globais do sistema, como o e-mail destinatário do backup.

---

## Regras de Negócio

- Padeiros só podem editar produções e avaliações de até 3 dias atrás; gerentes não têm essa restrição.
- O login de padeiros é bloqueado fora do horário definido pelo gerente. Gerentes podem acessar a qualquer hora.
- Uma produção só pode receber uma avaliação. Tentativas de reavaliar retornam erro.
- A exclusão de uma produção apaga sua avaliação automaticamente (cascade) e registra um log de auditoria.
- As permissões individuais (registrar, avaliar, ver histórico, editar, excluir) são emitidas no payload do JWT e verificadas tanto no backend quanto no frontend.

---

## Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| Backend | NestJS 11, TypeScript, Prisma ORM |
| Banco de dados | PostgreSQL 15 |
| Autenticação | JWT + bcrypt |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Gráficos | Recharts |
| API meteorológica | Open-Meteo |
| E-mail | Nodemailer |
| Infraestrutura | Docker, Docker Compose |
| Testes | Jest (unitários e e2e com Supertest) |

---

## Como Executar Localmente

**Pré-requisitos:** Node.js 20+, Docker e Docker Compose instalados.

**1. Subir o banco de dados**
```bash
docker-compose up -d
```

**2. Configurar e iniciar o backend**
```bash
cd backend
cp .env.example .env
# Preencha DATABASE_URL, JWT_SECRET, CIDADE_LAT, CIDADE_LON e as credenciais de e-mail
npm install
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

**3. Iniciar o frontend**
```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3001` e a API em `http://localhost:3000`.

**Variáveis de ambiente do backend**

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Chave secreta para assinatura dos tokens |
| `CIDADE_LAT` | Latitude da cidade para previsão do tempo |
| `CIDADE_LON` | Longitude da cidade |
| `EMAIL_USER` | Conta de e-mail para envio do backup |
| `EMAIL_PASS` | Senha ou token da conta de e-mail |

---

## Testes

O backend possui testes unitários com Jest e testes end-to-end com Supertest.

```bash
cd backend
npm run test          # Testes unitários
npm run test:cov      # Testes com cobertura
npm run test:e2e      # Testes end-to-end
```

---

## Decisões de Projeto

**Por que NestJS?** A arquitetura modular do NestJS espelha a separação de domínios do sistema (produção, avaliação, usuário) e facilita a escrita de testes unitários por injeção de dependência.

**Por que o algoritmo de similaridade em vez de regressão linear?** Com volumes iniciais de dados pequenos e variáveis de entrada correlacionadas (temperatura e tempo de fermentação), a abordagem de similaridade ponderada é mais robusta do que modelos paramétricos. Ela não requer treinamento offline, melhora automaticamente à medida que o histórico cresce e é interpretável — o próprio sistema devolve as fornadas que fundamentaram a sugestão.

**Por que Open-Meteo?** A API é gratuita, sem necessidade de cadastro ou chave para uso básico, e fornece previsão horária com resolução suficiente para os intervalos de fermentação típicos (2–6 horas).
