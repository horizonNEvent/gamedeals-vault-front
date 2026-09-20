# GameDeals Vault — Interface Web (Front-End)

Interface de usuario moderna para o **GameDeals Vault**, aplicacao web para rastreamento de ofertas de jogos digitais de PC, organizacao de backlog gamer e conversao cambial automatica (USD / BRL).

Este projeto representa o **Modulo de Interface (Componente Principal)** do MVP da PUC Minas para a disciplina de Arquitetura de Sistemas Web e Componentizacao.

---

## Repositórios do Projeto (MVP PUC Minas)
* 🌐 **Componente Principal (Interface Web Front-End):** [https://github.com/horizonNEvent/gamedeals-vault-front](https://github.com/horizonNEvent/gamedeals-vault-front)
* ⚙️ **Componente Secundário (API REST Back-End):** [https://github.com/horizonNEvent/gamedeals-vault-api](https://github.com/horizonNEvent/gamedeals-vault-api)

---

## Arquitetura do Sistema (Cenário 1 — MVC)

Conforme estabelecido nos requisitos do edital, a solução implementa a arquitetura de módulos baseada no **Cenário 1**, sumarizando todos os componentes utilizados:

![Arquitetura da Aplicação](./architecture.png)

```mermaid
flowchart LR
    subgraph Cliente["Cliente"]
        Browser["🌐 Browser do Usuário<br/>(Desktop / Mobile)"]
    end

    subgraph FrontEnd["Componente 1: Interface (Front-End)"]
        React["⚛️ React 18 + Vite<br/>(Nginx Alpine :3000)"]
    end

    subgraph BackEnd["Componente 2: API Back-End (FastAPI)"]
        Routes["🛣️ Routes<br/>(app/routes/games.py)"]
        Controller["⚙️ Controller / Services<br/>(cheapshark.py & currency.py)"]
        Model["📦 Model / Schemas<br/>(SQLAlchemy & Pydantic)"]
        DB[("💾 SQLite<br/>(gamedeals.db)")]
        
        Routes -->|Encaminha request| Controller
        Controller -->|Leitura / Escrita| Model
        Model <--> DB
    end

    subgraph Externas["Serviços Externos Públicos"]
        CheapShark["🎮 CheapShark API<br/>(Ofertas PC /deals)"]
        AwesomeAPI["💵 AwesomeAPI<br/>(Cotação USD/BRL)"]
    end

    Browser <-->|Interação Web| React
    React <-->|HTTP REST JSON<br/>GET, POST, PUT, DELETE| Routes
    Controller <-->|Async HTTP /deals| CheapShark
    Controller <-->|Async HTTP /last/USD-BRL| AwesomeAPI
```

### Componentes Utilizados:
* **Interface (Front-End):** React 18 + Vite servido via Nginx Alpine (porta `3000:80`).
* **API Back-End (FastAPI):** Python 3.12 com FastAPI, Uvicorn e SQLite (porta `8000:8000`).
* **Rotas e Controllers:** Roteamento REST modularizado e controllers para tratamento de regras de negócio.
* **Persistência Relacional:** SQLite via SQLAlchemy com volume Docker persistente.
* **APIs Externas Públicas:** 
  * **CheapShark API:** Catálogo de ofertas de jogos de PC e dados de lojas digitais.
  * **AwesomeAPI:** Cotação comercial oficial em tempo real do Dólar para Real (USD -> BRL).

---

## Sumario
- [Recursos e Diferenciais Visuais](#recursos-e-diferenciais-visuais-criterio-inovacao)
- [Cumprimento dos Metodos HTTP](#cumprimento-dos-metodos-http)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Integracao com APIs Externas](#integracao-com-apis-externas)
- [Como Executar Localmente](#como-executar-localmente)
- [Como Executar via Docker](#como-executar-via-docker)
- [Execucao Orquestrada (Docker Compose)](#execucao-orquestrada-docker-compose)

---

## Recursos e Diferenciais Visuais (Criterio Inovacao)
* **Gamer Dark Mode:** Design imersivo construido em Vanilla CSS, com efeitos de neon, glassmorphism e micro-interacoes fluidas.
* **Seletor de Moeda (BRL / USD):** Permite ao usuario alternar entre visualizar todos os precos e economias em Reais (R$) ou Dolares ($), com badge indicador da cotacao oficial em tempo real da AwesomeAPI.
* **Dashboard de Metricas em Tempo Real:** Cartoes com contagem total de titulos, somatorio da economia acumulada (em R$ ou $), media de desconto (%) e total de jogos finalizados.
* **Busca com Tags de Sugestao:** Pesquisa interativa na API com sugestoes rapidas para franquias populares (ex: *Batman*, *The Witcher*, *Cyberpunk 2077*, *Elden Ring*).
* **Organizacao de Backlog por Status:** Filtros rapidos com contadores dinamicos (*Lista de Desejos*, *Fila do Backlog*, *Jogando*, *Zerado*).
* **Feedback Visual com Toasts:** Alertas visuais animados confirmando o sucesso ou falha de cada operacao HTTP.

---

## Cumprimento dos Metodos HTTP

A interface interage com o Back-End realizando chamadas para os 4 metodos REST obrigatorios:

1. **`GET`**:
   * Consulta de ofertas externas (`GET /api/external/deals`).
   * Listagem dos jogos salvos e estatisticas consolidadas (`GET /api/games`).
   * Consulta de cotacao de moeda (`GET /api/currency/rate`).
2. **`POST`**:
   * Adicao de novo jogo a colecao atraves do modal interativo com exibicao de valores em USD e BRL (`POST /api/games`).
3. **`PUT`**:
   * Edicao de status no backlog, avaliacao pessoal de 1 a 5 estrelas e anotacoes do jogador (`PUT /api/games/{id}`).
4. **`DELETE`**:
   * Remocao permanente do jogo do banco de dados com modal de confirmacao (`DELETE /api/games/{id}`).

---

## Tecnologias Utilizadas
* **React 18**
* **Vite 5** (Build tool de ultima geracao)
* **Vanilla CSS Moderno** (Variaveis CSS, Flexbox/Grid, Glassmorphism, responsividade pura)
* **Lucide React** (Icones vetoriais SVG)
* **Nginx Alpine** (Servidor web leve para producao no Docker)

---

## Integracao com APIs Externas

1. **CheapShark API (`https://www.cheapshark.com/api/1.0/`):**
   * Gratuita, publica e sem chave de API.
   * Utilizada para busca de ofertas e relacao de lojas parceiras.
2. **AwesomeAPI (`https://economia.awesomeapi.com.br/last/USD-BRL`):**
   * Gratuita, publica e sem chave de API.
   * Utilizada para buscar a cotacao oficial do Dolar em tempo real e converter os precos para o Real brasileiro.

---

## Como Executar Localmente

### Pre-requisitos
* Node.js 18 ou superior instalado.
* A API Back-End deve estar em execucao na porta `8000`.

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/horizonNEvent/gamedeals-vault-front.git
   cd gamedeals-vault-front
   ```

2. **Instale as dependencias:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

4. **Acesse no navegador:**
   Abra [http://localhost:3000](http://localhost:3000)

---

## Como Executar via Docker

Para rodar a interface em um contêiner Docker isolado:

### 1. Construir a imagem da Interface:
```bash
docker build -t gamedeals-front .
```

### 2. Executar o container do Front-End:
```bash
docker run -d -p 3000:80 --name gamedeals-front gamedeals-front
```

### 3. Acessar no navegador:
* **Interface Web:** [http://localhost:3000](http://localhost:3000)

> **Comunicação Direta:** A interface no seu navegador conecta-se automaticamente à API na porta `8000` (`http://localhost:8000`), sem necessidade de criar redes compartilhadas no Docker.

### 4. Ver logs e parar o container:
```bash
# Visualizar logs em tempo real:
docker logs -f gamedeals-front

# Parar e remover o container:
docker stop gamedeals-front && docker rm gamedeals-front
```

---

## Execucao Orquestrada (Docker Compose)

Conforme a **Observacao 2** do edital, o arquivo `docker-compose.yml` esta disponibilizado na raiz deste repositorio da Interface para subir toda a stack (Back-End + Front-End) com um unico comando:

```bash
docker compose up --build
```

* **Front-End:** [http://localhost:3000](http://localhost:3000)
* **Back-End (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)
