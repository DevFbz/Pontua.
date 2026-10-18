# PRD — Pontua (uso pessoal)

- Status: MVP funcional em desenvolvimento
- Versão: 0.2
- Data: 18/10/2026
- Produto: app web mobile-first para uso particular de uma única pessoa

## 1. Visão
Um espaço simples e privado para registrar horários pessoais de entrada, saída e intervalos, conferir o tempo trabalhado e manter um histórico exportável.

## 2. Usuário e problema
Usuário único: a própria pessoa que mantém o controle. Precisa registrar a jornada rapidamente no celular, corrigir ou completar registros passados, visualizar o acumulado e guardar uma cópia dos dados. Não há RH, gestor, múltiplas empresas, autenticação ou fluxo de aprovação no escopo atual.

## 3. Objetivos
- Registrar entrada, início/fim de intervalo e saída em poucos toques.
- Permitir inclusão manual de marcação anterior, com indicação clara de que foi manual.
- Consultar registros agrupados por dia e mês.
- Calcular estimativa de horas trabalhadas e saldo usando meta diária configurável.
- Exportar registros em CSV e salvar backup JSON.
- Funcionar bem em telas móveis, mantendo dados no dispositivo.

## 4. Fora do escopo
- Substituição de ponto oficial da empresa, REP ou comprovação trabalhista.
- Multiusuário, login, nuvem/sincronização entre aparelhos ou compartilhamento.
- Aprovação por liderança/RH, anexos médicos, biometria, localização, folha e escalas complexas.
- Cálculo oficial de banco de horas, feriados, adicional noturno ou regras coletivas.

## 5. Princípios de produto
- Clareza antes de densidade; acessibilidade e uso com uma mão.
- Marcação adicionada manualmente deve ser identificada como tal.
- Privacidade por padrão, sem analytics remoto.
- O saldo é estimativa pessoal, não valor oficial.

## 6. Escopo funcional
### MVP — usuário individual
- Dashboard diário com data/hora local, ação contextual, sequência de marcações e resumo do dia.
- Registro de entrada, início/fim de intervalo e saída por um formulário que sugere a hora atual e permite informar/editar a hora antes de salvar.
- Inclusão manual com data, tipo e hora.
- Histórico diário/mensal, horas computadas e saldo estimado.
- Exportação CSV e backup JSON.
- Preferência de nome e meta diária ajustável.
- Exclusão explícita de registros com confirmação.
- Navegação mobile e desktop, estados vazios, diálogos e mensagens de confirmação.

### Melhorias posteriores
- Importação de backup JSON, edição individual, tema escuro, calendário de dias úteis e gráficos mensais.
- Lembretes locais opt-in e instalação PWA após validação nos navegadores-alvo.

## 7. Regras de cálculo
- Horários são lidos do relógio local do aparelho e armazenados como timestamps ISO.
- Trechos de trabalho são calculados entre entrada/retorno de intervalo e intervalo/saída.
- Minutos em aberto só contam até a última batida registrada; não se presume que o relógio atual seja hora de saída.
- Meta padrão: 8 horas por dia; ajustável em incrementos de 30 minutos.
- Saldo é minutos computados menos a meta diária, uma estimativa simples e pessoal.
- Eventos fora de sequência não devem gerar horas negativas.

## 8. UX e conteúdo
- Navegação inferior: Início, Histórico e Ajustes; navegação lateral em telas maiores.
- Uma ação primária contextual abre um formulário com o tipo de batida esperado e horário preenchido com a hora atual, editável antes de confirmar.
- Confirmação visual após registro, com tipo e hora local.
- Ações destrutivas exigem confirmação; inclusão manual fica marcada como manual.
- Formatação pt-BR, horários de 24 horas e preferência de redução de movimento.
- Design original definido em `../DESIGN.md`; não reproduzir marca ou telas proprietárias.

## 9. Critérios de aceite
- Registrar entrada, intervalo, retorno e saída e vê-los no dashboard e histórico.
- Após recarregar no mesmo navegador, histórico e preferências permanecem.
- Incluir marcação em data anterior e identificá-la como manual.
- Navegar entre meses sem perder dados.
- Exportar CSV com data, hora, tipo e origem; salvar backup JSON.
- Alterar nome/meta e manter após reload.
- Excluir o dia somente após confirmação.
- Testes unitários cobrem duração, saldo, evento aberto, ordem inválida e criação de marcação.
- Layout utilizável em largura 360 px e desktop, sem backend.

## 10. Privacidade e limites
Dados ficam no localStorage deste navegador, sem envio ao servidor. O app não cifra os dados; qualquer pessoa com acesso ao perfil do navegador pode eventualmente acessá-los. Apagar dados do navegador pode apagar o histórico. Fazer backup periódico. Relógio/fuso dependem do aparelho.

## 11. Melhorias futuras
Importar backup JSON, tema escuro, edição individual, calendário de dias úteis, lembretes locais opt-in e gráficos mensais.

## 12. Perguntas em aberto
- Quais horários/intervalos padrão e meta diária você costuma usar?
- Fins de semana devem contar como dias normais ou sem meta?
- Você quer lembretes locais de horário ou prefere não receber notificações?

## Referência de inspiração
A descrição pública do My Ahgora apresenta consulta a batidas e banco de horas, além de solicitações de ajustes/abonos. Para este produto individual, selecionamos registro, histórico e saldo estimado, sem replicar identidade ou interface proprietária. Referência consultada em 18/10/2026: https://play.google.com/store/apps/details?id=br.com.ahgora.myahgora&hl=pt_BR
