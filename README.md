# Padaria Royal - Sistema de Gestão de Produção (MRP)

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=for-the-badge&logo=nestjs&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![Postgres](https://img.shields.io/badge/postgres-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

Um Sistema de Gestão de Produção (MRP - Material Requirements Planning) Full Stack desenvolvido para digitalizar o controle de estoque, qualidade e fornadas de uma panificadora industrial. O objetivo principal da aplicação é transformar a intuição empírica em um processo preditivo, científico e guiado por dados (Data-Driven).

---

## Principais Funcionalidades

* **Algoritmo Preditivo de Insumos (Machine Learning):** Implementação de uma variação do algoritmo K-Nearest Neighbors (K-NN Ponderado) que sugere a proporção exata de fermento. O cálculo cruza a temperatura ambiente atual com o histórico de produções de nota máxima. A interface alerta visualmente o usuário caso a IA sugira parâmetros baseados em tempos de fermentação diferentes do planejado.
* **Integração Meteorológica Automatizada:** Consumo em tempo real da API externa Open-Meteo para capturar as previsões de temperatura horária e alimentar os cálculos do algoritmo.
* **Dashboards Analíticos:** Painéis interativos para monitoramento do padrão de qualidade (Feedback Loop) das fornadas, permitindo a exclusão e gerenciamento das avaliações pendentes diretamente na interface de controle.
* **Gestão e Modelagem de Dados:** Tratamento de dados (ETL) a partir de importações CSV legadas e modelagem relacional rigorosa para rastreamento completo de insumos, temperaturas e tempos de fermentação.

---

## Arquitetura e Tech Stack

O projeto segue uma arquitetura em 3 camadas (3-Tier), garantindo separação de responsabilidades, tipagem estática ponta a ponta e alta coesão.

### Backend (API REST)
* **Framework:** NestJS (Node.js)
* **Linguagem:** TypeScript
* **Banco de Dados:** PostgreSQL
* **ORM:** Prisma (Gerenciamento de Migrations e Tipagem)

### Frontend (Interface)
* **Framework:** Next.js (React) com App Router
* **Estilização:** Tailwind CSS
* **Visualização de Dados:** Recharts

### Infraestrutura
* Containerização de banco de dados utilizando Docker e Docker Compose para assegurar paridade entre os ambientes de desenvolvimento e produção.

---

## Fundamentação Científica: O Algoritmo K-NN Ponderado

O núcleo de inteligência do sistema atua na otimização do uso de levedura (fermento). A API consulta exclusivamente o subconjunto de fornadas históricas classificadas com nota de excelência. 

Para cada registro histórico de sucesso, o sistema calcula a Distância Euclidiana simplificada em relação ao cenário climático e temporal atual requisitado pelo usuário:

$$Distancia = |T_{ini} - T_{atual}| + |T_{fim} - T_{alvo}| + \left| \frac{Tempo_{hist} - Tempo_{alvo}}{60} \right|$$

Onde a temperatura é a principal variável e a diferença de tempo de fermentação atua como penalidade. A partir dessa distância, calcula-se o peso de relevância de cada fornada histórica (evitando divisões por zero):

$$Peso = \frac{1}{Distancia + 0,1}$$

As sugestões finais são geradas através de uma média ponderada das proporções de insumos dos "vizinhos mais próximos" (cenários mais similares), garantindo alta precisão técnica sob variações climáticas.

---

## Como Rodar o Projeto Localmente

### Pré-requisitos
* Docker e Docker Compose
* Node.js (v18+) e NPM

### Setup e Execução

1. **Clone o repositório:**
   ```bash
   git clone [https://github.com/seu-usuario/padaria-royal.git](https://github.com/seu-usuario/padaria-royal.git)
   cd padaria-royal
   ```

2. **Configuração de Ambiente:**
    Configure as variáveis de ambiente necessárias em ambas as aplicações. Na pasta backend, crie o arquivo .env baseado no .env.example e insira a string de conexão do PostgreSQL.
   
3. **Suba os Containers de Infraestrutura:**
    ```bash
    docker compose up -d
    ```
    
4. **Inicie o Backend e as Migrations:**
    Em um terminal, execute:
    ```bash
    cd backend
    npm install
    npx prisma migrate dev
    npm run start:dev
    ```
    
5. **Inicie o Frontend:**
    Em um segundo terminal, execute:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```
A aplicação estará disponível em `http://localhost:3000` e a API rodando em `http://localhost:3001`.
