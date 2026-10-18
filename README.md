# Pontua — documentação do produto

Base de produto para um app web mobile-first de registro e consulta de jornada de trabalho. Nome provisório: Pontua.

## Uso pessoal
O Pontua é um controle pessoal: não substitui marcação oficial ou sistema da empresa. O MVP roda localmente e guarda dados no armazenamento do navegador deste dispositivo; o app não envia registros a servidor. Não há conta, sincronização ou backend.

## Rodar e testar
Requer Node.js 20+ (sem dependências externas):

```sh
npm run dev
```
Abra http://127.0.0.1:4173. Testes: `npm test`.

Faça backup periódico em Ajustes → Salvar backup JSON. Limpar dados do navegador remove o histórico se não houver backup.

## Documentos
- [PRD](docs/PRD.md) — problema, objetivos, personas, escopo, requisitos e métricas.
- [Arquitetura](docs/ARCHITECTURE.md) — visão lógica, componentes e decisões iniciais.
- [Modelo de domínio](docs/DOMAIN.md) — entidades e regras centrais.
- [Contrato de API](docs/API.md) — endpoints propostos para uma possível evolução com servidor.
- [Segurança e privacidade](docs/SECURITY-PRIVACY.md) — baseline LGPD e limites do armazenamento local.
- [Roadmap](docs/ROADMAP.md) — fases e critérios de saída.
- [Decisões](docs/adr/README.md) — registro de decisões arquiteturais.
- [Design system](DESIGN.md) — linguagem visual original, tokens e padrões mobile.

## Limites atuais
Dados ficam neste navegador e não são sincronizados ou criptografados pela aplicação; proteja seu dispositivo e salve backups em local seguro. Horários usam relógio local do dispositivo. Saldo é estimativa pessoal, calculada pela meta diária configurada e não considera feriados, escalas, adicionais, regras coletivas ou folha. O app não é um REP e não deve ser tratado como registro oficial de jornada.
