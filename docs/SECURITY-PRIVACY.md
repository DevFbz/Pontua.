# Segurança, privacidade e conformidade

Nota de escopo: este baseline amplo descreve controles para uma eventual versão multiusuário/servidor, não recursos presentes no MVP. O app atual é local, individual e sem transmissão de dados, autenticação ou criptografia gerenciada pela aplicação. Veja os limites concretos em `README.md` e não exponha o servidor de desenvolvimento.

## LGPD e minimização
- Mapear controlador, operador, finalidades, bases legais, destinatários, transferências e prazos de retenção com o cliente e DPO/jurídico.
- Documentar inventário de dados e fluxo; atender direitos dos titulares e processo de incidente.
- Dados biométricos e dados de saúde são sensíveis; não coletar biometria no MVP. Atestados podem revelar saúde: limitar acesso, finalidade, retenção e exibição.
- Geolocalização é pessoal e de alto impacto contextual: desabilitada por padrão; requer necessidade, transparência, política, acesso mínimo e alternativa operacional definida.
- Não colocar CPF, justificativas, anexos, tokens ou coordenadas em analytics/logs/notificações.

## Controles técnicos
- OIDC, MFA para administração, RBAC com menor privilégio, isolamento por tenant e revisão periódica de acessos.
- TLS moderno, criptografia em repouso, gestão/rotação de chaves, secrets manager e ambientes segregados.
- Sanitização/validação de entrada, proteção CSRF/XSS, rate limiting, headers seguros, upload privado e análise de malware.
- Sessões revogáveis, proteção contra brute force, alertas de login e fluxo de recuperação que não enumere usuários.
- Audit trail append-only para alterações de configuração, acessos privilegiados, pedidos e decisões.
- Threat modeling, SAST/dependências, pentest e resposta a vulnerabilidades antes de produção.
- Backups criptografados; testar restauração, descarte e contingência.

## Ponto eletrônico — gate obrigatório
O MTE descreve REP-C, REP-A e REP-P na regulamentação da Portaria 671/2021; aplicabilidade e requisitos dependem do modelo e do uso real. Antes de capturar registros para uso trabalhista, validar versão vigente da norma, Anexo aplicável, requisitos do programa/coletor, registros e documentos exigidos, integridade, exportação e tratamento junto a especialista e MTE. A equipe não deve inferir que PWA genérico é REP-P conforme.

## Retenção e direitos
Não fixar prazo arbitrário neste rascunho. Aprovar tabela por categoria (ponto, auditoria, anexo, sessão, telemetria), fundamento, início do prazo, bloqueio legal, descarte verificável e processo de solicitação do titular.

## Incidentes
Preparar responsáveis e contatos, triagem, contenção, preservação de evidências, avaliação de impacto, comunicação conforme prazos/regras vigentes e pós-incidente. Exercitar antes do piloto.

## Referências oficiais a validar na implantação
- Lei nº 13.709/2018 (LGPD): https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
- MTE, Perguntas e Respostas REP/Portaria 671: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/fiscalizacao-do-trabalho/Perguntas%20e%20Respostas%20REP
- Portaria MTP 671 compilada: https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/legislacao/portarias-1/portarias-vigentes-3/WORDPortarian671de8denovembrode2021compilada21.07.2026.pdf
