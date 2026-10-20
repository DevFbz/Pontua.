# Pontua — documentação do produto

Base de produto para um app web mobile-first de registro e consulta de jornada de trabalho. Nome provisório: Pontua.

## Uso pessoal
O Pontua é um controle pessoal: não substitui marcação oficial ou sistema da empresa. O MVP roda localmente e guarda registros no armazenamento do navegador deste dispositivo; fotos dos comprovantes ficam no IndexedDB do mesmo navegador. O app não envia esses dados a servidor. Não há conta, sincronização ou backend.

## Rodar e testar
Requer Node.js 20+ (sem dependências externas):

```sh
npm run dev
```
Abra http://127.0.0.1:4173. Testes: `npm test`.

## Deploy no Vercel
O Pontua não precisa de backend. `npm run build` monta uma pasta `dist/` apenas com os arquivos públicos; o `vercel.json` usa esse build no preset Other.

Com a CLI instalada e autenticada (`vercel login`), execute `vercel` para criar um deploy de preview ou `vercel --prod` para publicar em produção. Na primeira execução, a CLI pedirá para vincular este diretório a um projeto Vercel.

Ao registrar uma batida, use “Tirar foto do comprovante” para abrir a câmera traseira do celular ou escolher uma imagem. A foto é opcional, fica associada à batida e pode ser aberta pelo histórico. O navegador pode oferecer a câmera ou o seletor de arquivos, conforme o dispositivo.

Registros e fotos não migram automaticamente entre navegadores, dispositivos ou entre o endereço do GitHub Pages e o domínio do Vercel.

Faça backup periódico em Ajustes → Salvar backup JSON; o arquivo JSON inclui as fotos anexadas e pode ficar maior. Limpar dados do navegador remove registros e fotos se não houver backup.

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
Dados e fotos ficam neste navegador e não são sincronizados ou criptografados pela aplicação; proteja seu dispositivo e salve backups em local seguro. Horários usam relógio local do dispositivo. Saldo é estimativa pessoal, calculada pela meta diária configurada e não considera feriados, escalas, adicionais, regras coletivas ou folha. O app não é um REP e não deve ser tratado como registro oficial de jornada.
