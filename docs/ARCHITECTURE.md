# Arquitetura — MVP pessoal local-first

O diagrama e os componentes detalhados abaixo são a visão futura original, não a arquitetura do MVP atual. A implementação atual é HTML/CSS/JavaScript ES modules, servidor Node local em 127.0.0.1 e localStorage no navegador; não há PWA, login, API, banco remoto ou sincronização. Veja `src/` e a seção “Arquitetura atual” adiante.

## Visão lógica

```text
PWA Mobile / Console de liderança e RH
           │ HTTPS / OIDC
       API Gateway
           │
 ┌─────────┴──────────┐
 Identidade/RBAC   Serviços de domínio
                   ├─ Jornada e marcações (append-only)
                   ├─ Espelho e saldos (projeções)
                   ├─ Solicitações e aprovações
                   ├─ Anexos privados
                   └─ Notificações
                        │
        PostgreSQL + outbox/eventos + object storage
                        │
              Integrações / exportações
```

## Componentes
- Cliente web/PWA: renderização responsiva, acessibilidade, armazenamento local mínimo; nenhuma lógica local é autoridade para confirmar ponto.
- Identidade: OIDC/OAuth2 com SSO corporativo quando disponível; sessão curta renovável, revogação e MFA para perfis privilegiados.
- API: autorização por tenant, colaborador e papel em toda requisição. Separar comandos (registro/solicitação) de consultas.
- Serviço de marcações: gravação imutável; armazenar tempo do servidor e tempo declarado pelo coletor como campos distintos, contexto de origem, versão e idempotency key. Não permitir edição destrutiva.
- Projeções: espelho e saldo derivados de registros e regras versionadas. Toda regra deve incluir período/fuso/fonte e versão; conciliação com sistema oficial.
- Aprovações: máquina de estados com ator, momento, motivo e histórico.
- Anexos: armazenamento privado com URL temporária, antivírus, limites e política de retenção.
- Outbox: garantir publicação confiável de eventos após commit; consumidores idempotentes.
- Observabilidade: métricas, logs estruturados com minimização de PII, traces e alertas operacionais.

## Dados e limites de confiança
Tenant isolado por autorização e, se adequado, políticas de segurança no banco. Criptografia em trânsito e em repouso. Segredos em secret manager, nunca no repositório. Ambiente de desenvolvimento usa dados sintéticos. Acesso de suporte é temporário, justificado e auditado.

## Requisitos de robustez
- Idempotência para comando de marcação e envio de solicitação.
- Consistência forte na confirmação de marcação; interface não chama sucesso antes de persistência confirmada.
- Relógio confiável no servidor, armazenamento explícito de UTC e fuso aplicável; nunca inferir horário trabalhista apenas do navegador.
- Offline não deve enfileirar marcação oficial até haver parecer de conformidade sobre coletor, recibo, integridade e sincronização.
- Backups com testes de restauração, plano de incidentes e objetivos RPO/RTO aprovados.

## Stack
Não fixada. Escolher após decidir equipe, hospedagem, autenticação e requisitos REP. A decisão deve documentar versões suportadas, observabilidade, custo, portabilidade e manutenção.

## Diagramas futuros
Adicionar sequência de marcação online/offline e deployment diagram após decisão sobre REP-P e integração com fonte de verdade.
