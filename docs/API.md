# API — contrato preliminar v0 (não implementado)

O MVP é local-first e não possui API; os endpoints descritos abaixo são apenas uma proposta antiga para possível versão multiusuário. Não existem neste aplicativo.

Base `/api/v1`; JSON UTF-8; autenticação por Bearer token OIDC. Contratos são propostas e não alegam conformidade REP.

## Convenções
- Datas em ISO 8601 UTC; respostas de interface incluem timezone IANA para apresentação.
- Erros seguem `{ "error": { "code": "...", "message": "...", "request_id": "..." } }` sem dados de outros tenants.
- Comandos que podem duplicar efeito exigem `Idempotency-Key`.
- Paginação por cursor; limites e rate limiting documentados por endpoint.

## Colaborador
- `GET /me` — perfil mínimo, permissões e organização ativa.
- `GET /me/punches?from=...&to=...` — registros e estados.
- `POST /me/punches` — body `{ "kind": "clock_in|clock_out|break_start|break_end", "client_observed_at": "...", "timezone": "America/Sao_Paulo" }`; retorno inclui `id`, `server_recorded_at`, `status`, `receipt`.
- `GET /me/timesheet?period=YYYY-MM` — dias, marcações e totais com origem/frescor.
- `GET /me/balance?as_of=...` — saldo, período, última atualização e fonte.
- `POST /me/adjustment-requests` — `{ "punch_id": null, "work_date": "YYYY-MM-DD", "requested_kind": "...", "requested_at": "...", "category": "...", "reason": "...", "attachment_ids": [] }`.
- `GET /me/adjustment-requests` e `GET /me/adjustment-requests/{id}` — estado e histórico autorizados.
- `POST /me/attachments` — fluxo de upload autorizado; validar MIME real, tamanho, antivírus e expiração.

## Liderança/RH (escopo autorizado)
- `GET /teams/{team_id}/requests?status=...`
- `POST /requests/{id}/decisions` — `{ "decision": "approve|reject|needs_information", "reason": "..." }`.
- `GET /audit-events` — somente função autorizada; filtros e exportação auditados.

## Códigos de erro relevantes
`401 unauthenticated`, `403 forbidden`, `404 not_found`, `409 idempotency_conflict|invalid_transition`, `422 validation_error`, `429 rate_limited`, `503 temporarily_unavailable`.

## Regras de segurança
Autorizar tenant + objeto + ação em cada chamada; validar propriedade dos IDs de anexos; não confiar em organization_id enviado pelo cliente; tokens fora de URL; limitar logs de request; respostas de registro nunca retornam sucesso antes de commit durável. Definir contrato final, esquema OpenAPI e revisão de ameaças antes da implementação.
