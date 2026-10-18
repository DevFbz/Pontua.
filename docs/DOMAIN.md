# Modelo de domínio inicial

Nota: este documento define um modelo futuro multiusuário; o MVP implementado usa a estrutura simples descrita em `src/domain.mjs` e `localStorage`. Não há organizações, papéis ou aprovações no app atual.

## Entidades
- Organization: tenant, políticas e configurações.
- Person: vínculo de colaborador, identificador interno e estado; dados pessoais mínimos.
- Membership/Role: organização, sujeito, papéis e escopos de acesso.
- WorkSchedule: regra/escala versionada, vigência, zona IANA e calendário aplicável.
- PunchEvent: registro original imutável; id, person_id, organization_id, kind (entrada/saída/início/fim intervalo), server_recorded_at UTC, client_observed_at opcional, timezone, source, collector_id, idempotency_key, sincronização, integridade e metadados permitidos.
- AdjustmentRequest: pedido vinculado ao dia/evento, horário proposto, categoria, justificativa, anexos referenciados e estado.
- Decision: ação append-only de aprovação/rejeição/solicitação de informação, responsável, instante e motivo.
- TimeBalanceSnapshot: saldo materializado com período, regra/versionamento, fonte e instante de cálculo; não é fonte primária.
- AuditEvent: ator, ação, alvo, timestamp, resultado e metadados minimizados.

## Invariantes
1. Um PunchEvent aceito nunca é apagado nem alterado; correção cria evento/ajuste vinculado e auditável.
2. Chave de idempotência única por organização/ator/ação dentro de janela definida.
3. Toda decisão referencia uma solicitação e ator autorizado na hora da decisão.
4. Estados de solicitação válidos: draft → submitted → under_review → approved | rejected | needs_information → submitted; transições registram histórico.
5. Saldos são projeções recalculáveis, identificados pela regra e pela janela usada.
6. UTC é persistido; zona IANA e regra vigente preservadas para exibição/cálculo local.
7. Isolamento entre organizações aplica-se também a anexos, exports, cache e tarefas assíncronas.

## Questões para modelagem detalhada
Definir uso de CPF ou identificador alternativo; política de retenção e descarte; múltiplos vínculos/contratos; regras de tolerância; feriados; turnos noturnos; jornada externa; divergência de relógios; trilha legal e formato de exportação. Revisar com jurídico e responsável técnico antes de congelar esquema.
