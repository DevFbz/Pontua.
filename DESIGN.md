---
version: alpha
name: Pontua
description: Mobile-first jornada de trabalho, com foco em confiança, clareza e autonomia.
colors:
  primary: "#163B36"
  secondary: "#4D625D"
  tertiary: "#B9F36A"
  neutral: "#F5F7F4"
  surface: "#FFFFFF"
  ink: "#17211F"
  muted: "#586561"
  border: "#DCE4DF"
  danger: "#B42318"
  warning: "#8A4B08"
typography:
  h1:
    fontFamily: Segoe UI
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
  h2:
    fontFamily: Segoe UI
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
  body-md:
    fontFamily: Segoe UI
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Segoe UI
    fontSize: 0.875rem
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: 10px
  md: 16px
  lg: 24px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    height: 52px
    padding: 16px
  button-accent:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    height: 52px
    padding: 16px
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
---

## Overview
Pontua tem identidade própria: verde profundo transmite estabilidade; lima funciona como acento pontual para ação positiva. Superfícies claras, tipografia legível e hierarquia editorial evitam aparência de painel corporativo comprimido. Não reutilizar logotipo, ícones, textos ou composição proprietária do MyAhgora.

## Colors
Usar primary para navegação, títulos e ações principais; tertiary apenas em CTA prioritário, indicador de sucesso ou destaque pequeno. Fundo neutral com cartões surface. Muted é texto secundário, nunca texto essencial de baixo contraste. Estados devem incluir ícone/rótulo além da cor. Validar contraste real de todos os pares e estados antes do lançamento; o linter pode reportar combinações insuficientes.

## Typography
Tipografia usa a fonte de interface local do sistema (Segoe UI em Windows, com fallback system-ui/sans-serif); assim não há chamadas a serviços de fontes externos. Números de jornada devem usar algarismos tabulares se a implementação permitir. Evitar caixa alta extensa, texto menor que 12 px e blocos longos em telas móveis.

## Layout
Mobile-first, grade de 4 px, conteúdo com margem lateral de 20 px em telefones e largura máxima de leitura em telas grandes. Barra inferior com quatro destinos e safe-area do dispositivo. Ações primárias em alcance do polegar; alvo tátil mínimo 44 × 44 px. Não depender de hover. Desktop expande para painel sem mudar hierarquia semântica.

## Elevation & Depth
Usar bordas suaves e elevação discreta para separar superfícies; não empilhar sombras. Feedback de estado pode usar fundo tonal e ícone, nunca apenas glow.

## Shapes
Cartões com 24 px, controles com 16 px, campos com 10 px e chips em pílula. Consistência importa mais que ornamento.

## Components
- Home: saudação enxuta, data e turno, status do dia e cartão de marcação com CTA contextual; abaixo, resumo de horas/saldo e últimas marcações.
- Marcação: ação separada e explícita; confirmação inclui hora, fuso, estado de envio e recibo/identificador quando confirmado.
- Estados: confirmado, enviando, pendente, falhou, em análise, aprovado e rejeitado; sempre com texto e affordance.
- Listas: separar por dia, mostrar origem e ajustes sem apagar registro original.
- Formulários: rótulos persistentes, motivo legível, revisão antes de enviar e confirmação com próximo passo.
- Navegação: Início, Espelho, Solicitações, Perfil; esconder ou adaptar áreas não autorizadas.
- Modo escuro é uma extensão planejada, não inversão automática de cores sem teste.

## Do's and Don'ts
- Faça: mostre claramente o que foi enviado, o que foi confirmado e o que ainda depende de aprovação.
- Faça: preserve dados legíveis com zoom e preferências de acessibilidade.
- Faça: usar linguagem humana e mensagens de erro recuperáveis.
- Não faça: replicar telas/ativos do MyAhgora nem insinuar afiliação.
- Não faça: usar animação para esconder latência ou declarar sucesso antes da confirmação.
- Não faça: solicitar biometria/localização por padrão ou mostrar dados pessoais na notificação.
