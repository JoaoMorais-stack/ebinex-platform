# Ebinex Paper Trading Platform

Ebinex is a fully local, fictional paper-trading and portfolio simulation built as a public software engineering portfolio project. It demonstrates a polished market dashboard, deterministic trading rules, local persistence, input validation and a dependency-free Node.js web server.

> Status: functional portfolio demonstration, version 1.0.0. Ebinex is not an exchange, financial institution, brokerage or live market product.

## Objective

Present a credible full-stack product experience while keeping every interaction reproducible, private and safe for public review.

## Problem

Financial interfaces are useful engineering exercises, but a public portfolio should not require sensitive information, third-party accounts or unpredictable services. This project isolates the useful product concepts in a deterministic local simulation.

## Features

- Persistent simulation disclosure across every screen.
- Overview with virtual equity, cash, allocation, watchlist and activity.
- Six fictional market scenarios with deterministic prices and chart series.
- Virtual buy and sell operations with strict quantity and balance rules.
- Simulated portfolio positions and complete local history.
- Local watchlist, display currency, compact mode and reduced motion settings.
- One-click restoration of the original fictional scenario.
- Responsive dashboard for desktop and mobile layouts.
- Automated domain, persistence, HTTP and security-boundary tests.

## Technologies

- Node.js 20+
- Node.js standard library HTTP server and test runner
- HTML5, CSS and vanilla JavaScript
- JSON persistence excluded from version control
- Canvas charts generated in the browser

No runtime package or external service is required.

## Architecture

```text
Browser dashboard
      |
      v
Loopback HTTP server -> validation and rate limit -> simulation service
                                                    |
                         bundled market scenario <--+--> disposable JSON state
```

The market module contains fixed synthetic quotes. The simulation service owns portfolio calculations and virtual operations. The store writes only disposable demonstration state. The HTTP layer serves static assets, validates local origins and exposes a small JSON API.

## Installation

```powershell
git clone <repository-url>
cd ebinex-paper-trading-platform
node --version
```

Node.js 20 or newer is recommended. There is no dependency installation step.

## Run

```powershell
npm start
```

Open `http://127.0.0.1:4173` in a browser. The server binds to `127.0.0.1` and does not expose the application to the local network.

To select another local port:

```powershell
$env:PORT=4300
npm start
```

## Demonstration

1. Review the fictional portfolio overview and watchlist.
2. Open **Markets** and select one of the bundled scenarios.
3. Open **Simulator**, choose a side and enter a virtual quantity.
4. Review the updated portfolio and local activity history.
5. Change display preferences or restore the starting scenario in **Settings**.

## Tests

```powershell
npm test
npm run check
```

The test suite covers portfolio calculations, virtual balance constraints, validation, persistence, local HTTP workflows, response headers, origin checks and request limiting.

## Project Structure

```text
ebinex-platform/
|-- data/
|   `-- .gitkeep          # Runtime state is ignored
|-- public/
|   |-- app.js            # Dashboard views and interactions
|   |-- index.html        # Accessible application shell
|   `-- styles.css        # Responsive visual system
|-- src/
|   |-- market.js         # Deterministic fictional market data
|   |-- simulation.js     # Domain rules and calculations
|   `-- store.js          # Disposable local JSON persistence
|-- tests/
|   |-- server.test.js
|   |-- simulation.test.js
|   `-- store.test.js
|-- LICENSE
|-- package.json
`-- server.js             # Loopback server and JSON API
```

## Limitations

- Prices, changes, charts and reference conversions are fixed illustrations.
- The project has one local fictional profile and no authentication system.
- JSON persistence is appropriate only for this single-process demonstration.
- There is no live feed, external account, blockchain, gateway or third-party API integration.
- The project does not provide financial guidance or real-world execution.

## Security and Privacy

- Every included user, balance, quote and history entry is synthetic.
- The application never requests personal identifiers, external credentials, secrets, real financial information or network destinations.
- The server binds to `127.0.0.1`, accepts local authorities and rejects non-local browser origins.
- JSON bodies are limited to 16 KiB and domain inputs use strict allowlists and numeric bounds.
- Requests are rate-limited in memory and responses include a restrictive Content Security Policy and related browser protections.
- Runtime state is excluded through `.gitignore` and can be restored from bundled constants.

## Status and Next Steps

The core demonstration, responsive interface, local persistence and automated tests are complete. Suitable future portfolio improvements include accessibility automation, theme preferences, configurable synthetic scenarios and richer deterministic analytics.

## License

Copyright (c) 2026 Joao Morais. All rights reserved. See [LICENSE](LICENSE).

---

# Plataforma Ebinex de Paper Trading

Ebinex e uma simulacao totalmente local e ficticia de paper trading e portfolio, criada como projeto publico de engenharia de software. O projeto demonstra um painel de mercado bem acabado, regras deterministicas, persistencia local, validacao de entrada e um servidor web Node.js sem dependencias externas.

> Status: demonstracao funcional de portfolio, versao 1.0.0. A Ebinex nao e uma exchange, instituicao financeira, corretora ou produto conectado ao mercado real.

## Objetivo

Apresentar uma experiencia full-stack convincente, mantendo cada interacao reproduzivel, privada e segura para avaliacao publica.

## Problema

Interfaces financeiras sao bons exercicios de engenharia, mas um portfolio publico nao deve exigir informacoes sensiveis, contas de terceiros ou servicos imprevisiveis. Este projeto isola os conceitos uteis do produto em uma simulacao local deterministica.

## Funcionalidades

- Aviso permanente de simulacao em todas as telas.
- Visao geral com patrimonio virtual, caixa, alocacao, watchlist e atividade.
- Seis cenarios de mercado ficticios com precos e graficos deterministas.
- Operacoes virtuais de compra e venda com regras estritas de quantidade e saldo.
- Posicoes simuladas e historico local completo.
- Watchlist e preferencias locais de exibicao, densidade e movimento.
- Restauracao do cenario ficticio inicial.
- Painel responsivo para computadores e dispositivos moveis.
- Testes automatizados de dominio, persistencia, HTTP e limites de seguranca.

## Tecnologias

- Node.js 20+
- Servidor HTTP e executor de testes da biblioteca padrao do Node.js
- HTML5, CSS e JavaScript puro
- Persistencia JSON excluida do controle de versao
- Graficos Canvas gerados no navegador

Nenhum pacote de execucao ou servico externo e necessario.

## Arquitetura

```text
Painel no navegador
        |
        v
Servidor HTTP local -> validacao e limite de requisicoes -> servico de simulacao
                                                            |
                        cenario de mercado incluido <--------+--> estado JSON descartavel
```

O modulo de mercado contem cotacoes sinteticas fixas. O servico de simulacao concentra os calculos e as operacoes virtuais. O armazenamento grava apenas o estado descartavel da demonstracao. A camada HTTP entrega os arquivos da interface, valida origens locais e oferece uma API JSON pequena.

## Instalacao

```powershell
git clone <url-do-repositorio>
cd ebinex-paper-trading-platform
node --version
```

Recomenda-se Node.js 20 ou mais recente. Nao existe etapa de instalacao de dependencias.

## Execucao

```powershell
npm start
```

Abra `http://127.0.0.1:4173` no navegador. O servidor usa `127.0.0.1` e nao expoe a aplicacao para a rede local.

Para selecionar outra porta local:

```powershell
$env:PORT=4300
npm start
```

## Demonstracao

1. Analise a visao geral do portfolio ficticio e a watchlist.
2. Abra **Markets** e selecione um dos cenarios incluidos.
3. Abra **Simulator**, escolha o lado e informe uma quantidade virtual.
4. Confira o portfolio atualizado e o historico local.
5. Altere as preferencias de exibicao ou restaure o cenario inicial em **Settings**.

## Testes

```powershell
npm test
npm run check
```

A suite cobre calculos de portfolio, limites de saldo virtual, validacao, persistencia, fluxos HTTP locais, cabecalhos de resposta, verificacao de origem e limite de requisicoes.

## Estrutura

Consulte a arvore de arquivos na secao em ingles. As pastas `src`, `public` e `tests` separam dominio, interface e verificacao automatizada.

## Limitacoes

- Precos, variacoes, graficos e conversoes de referencia sao ilustracoes fixas.
- O projeto possui um unico perfil local ficticio e nao implementa autenticacao.
- A persistencia JSON e adequada somente para esta demonstracao de processo unico.
- Nao ha feed ao vivo, conta externa, blockchain, gateway ou integracao com API de terceiros.
- O projeto nao fornece orientacao financeira nem execucao no mundo real.

## Seguranca e Privacidade

- Todos os usuarios, saldos, precos e registros incluidos sao sinteticos.
- A aplicacao nao solicita identificadores pessoais, credenciais externas, segredos, informacoes financeiras reais ou destinos de rede.
- O servidor usa `127.0.0.1`, aceita autoridades locais e rejeita origens de navegador nao locais.
- Corpos JSON sao limitados a 16 KiB e as entradas usam listas permitidas e limites numericos estritos.
- As requisicoes sao limitadas em memoria e as respostas incluem Content Security Policy restritiva e outras protecoes do navegador.
- O estado de execucao e excluido pelo `.gitignore` e pode ser restaurado a partir das constantes incluidas.

## Status e Proximos Passos

O nucleo da demonstracao, a interface responsiva, a persistencia local e os testes automatizados estao concluidos. Evolucoes adequadas incluem testes automatizados de acessibilidade, preferencias de tema, cenarios sinteticos configuraveis e analises deterministicas mais ricas.

## Licenca

Copyright (c) 2026 Joao Morais. Todos os direitos reservados. Consulte [LICENSE](LICENSE).
