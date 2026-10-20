# Estado verificável da primeira entrega

## Implementado

- Interface responsiva de lobby, desafios, torneios, carteira, classificação, regras e administração.
- Tabuleiro interativo com regras chess.js, promoção, roque, en passant, mate e detecção de empate.
- Desafios de créditos fictícios, reserva de entrada, confirmação, relógios de servidor, desistência e homologação.
- Empate por regra ou acordo gera nova partida, inverte as cores e preserva a reserva.
- Mata-mata com 2/4/8/16/32 inscritos, faixa de rating, aceite, progressão e prêmio para o campeão.
- Taxa administrativa fixada por desafio/torneio no momento da criação. Alterações não afetam compromissos existentes.
- Banimento, suspensão, reativação, verificação manual de rating e decisões com justificativa.
- Adaptador de autenticação Supabase e persistência no servidor com concorrência otimista e acesso negado aos clientes diretos.
- Worker privado Stockfish, enfileiramento de posições quando habilitado pelo administrador e resultados privados. Exige implantação separada de longa duração.
- Demonstração local explícita, contas fictícias e possibilidade de alternar jogador para testar os dois lados.

## Não confundir com produção financeira

Não estão habilitados depósitos, saques, CPF/KYC, Pix, split ou custódia de dinheiro real. Créditos não têm valor nem conversibilidade. Nenhuma solicitação bancária é feita. O agregado JSON desta primeira versão é apropriado para validação de baixo volume, não para operação financeira ou escala comercial. Antes de dinheiro real, substituir a persistência por ledger contábil normalizado, conciliação, auditoria independente e processos legais/operacionais aprovados.

## Pendências explícitas

- Organização Supabase nova, projeto e aplicação do schema. O conector não cria organizações.
- Gateway que aceite expressamente o modelo, identidade e confirmação da titularidade de saque.
- OAuth Lichess, vínculo verificável e eventual criação de partidas: não integrados. A aplicação atual usa tabuleiro próprio e não herda o anti-cheat do Lichess.
- Infraestrutura do worker Stockfish: o código existe, mas não está executando enquanto não houver host e segredos configurados.
- Stockfish indica melhor lance; coincidência isolada não é prova de fraude. Não há banimento automático neste MVP; decisões são administrativas, registradas. Não divulgar como detecção infalível.
- Fiscalização por câmera/tela: não integrada. Torneios configurados com esse requisito não podem começar.
- Proteção contra captura/foto não é garantida. Android usa FLAG_SECURE, que limita capturas no dispositivo e não bloqueia câmeras externas. Não há garantia de bloqueio de extensões.
- Classificação usa rating de referência verificado manualmente, sem Elo dinâmico.
- Sistema suíço, liga por temporada e desafios de avaliação ainda não implementados.
- Relógios não são WebSockets. A atualização usa consulta a cada 2 segundos. Expiração é processada por lance ou reivindicação de um participante; não há árbitro agendado independente.
- Torneios exigem lotação completa de potência de dois, não têm byes automáticos e são iniciados pelo admin após o horário.
- Recusa de convite/ausência após pareamento exige intervenção; não há W.O. automático.
- Homologação de resultados é administrativa nesta primeira versão. O prêmio não é disponibilizado antes da revisão.

## Supabase

Criar organização e projeto na região sa-east-1. Aplicar `supabase/schema.sql`. Configurar e-mail/senha e confirmação de e-mail no Auth. Inserir o domínio publicado nos redirects permitidos. Configurar na Vercel SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY e ADMIN_EMAILS. A chave de serviço é somente do servidor e worker. ADMIN_EMAILS é autorização de bootstrap; antes de produção, migrar para RBAC em tabela privada e revisão de permissões.

## Worker

Construir `docker build -f worker/Dockerfile -t arena-analysis .`. Executar com SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY como segredos do ambiente. STOCKFISH_PATH já é definido no Dockerfile. A engine usa 1 thread, 32 MB de hash e no máximo 1 segundo por posição. Para analisar cada lance sob carga, será necessário particionar a fila e implantar workers adicionais. O worker não publica sugestões para os jogadores, não decide pagamentos e não aplica banimentos.

## Google Play

A política de dinheiro real, jogos e torneios precisa ser revisada antes de submeter: https://support.google.com/googleplay/android-developer/answer/9877032?hl=pt-BR . A versão Android inicial carrega a aplicação sem recursos financeiros reais. Não é um mecanismo para contornar a política; qualquer habilitação de dinheiro real muda a elegibilidade e requer avaliação nova. O código Android não equivale a um AAB assinado nem à aprovação da loja. Conta Play Console, assinatura de distribuição, ficha de dados e testes exigidos serão necessários.


## Atualização v0.2 — partidas casuais e computador
- Busca grátis por ritmo e incremento; convites expiram em 3 minutos.
- Aceite dos dois jogadores, relógio validado no servidor e cancelamento por ausência após 90 segundos para desafios pendentes.
- Partidas casuais gratuitas finalizam automaticamente e atualizam Elo Arena (K=24). As partidas com créditos e os torneios seguem para homologação.
- Oito níveis de computador em Web Worker, com busca própria alfa-beta. Não é Stockfish e os níveis não têm equivalência oficial de Elo. Não altera rating nem movimenta créditos.
- Cores, relógio opcional, incremento, promoção, desistência, voltar lance no treino, giro do tabuleiro, PGN e retomada local. O relógio do treino pausa ao fechar o navegador.
- Aviso persistente de confirmação após cadastro e reenvio de confirmação; nome público salvo no cadastro e editável no perfil.
- Modelo português em supabase/templates/confirm-signup.html. Assunto sugerido: Confirme seu e-mail · Arena Xadrez.
- O painel Supabase em 20/10/2026 exige SMTP próprio ou Pro para personalizar os e-mails. Nenhum plano pago foi ativado e o modelo não foi aplicado ao serviço gratuito padrão.
- Sem serviço externo de e-mail, o remetente continua Supabase Auth e há limitações de entrega do serviço padrão.
- O jogo online usa consultas a cada 2 segundos; não há WebSockets próprios. A implantação continua em ambiente de testes.


## Fase 0.3
- Contador de campeonatos abertos/em andamento no menu; novos campeonatos geram aviso durante consulta online.
- Filas de pareamento distintas: grátis e com entrada idêntica. Filas com entrada reservam créditos de teste; expiração em 3 minutos devolve a reserva. Reais não se misturam a créditos.
- Glicko-2 por bullet/blitz/rápido/clássico; provisório nas primeiras 10 partidas ou RD>110, histórico individual, atualização idempotente na homologação. O rating não é intercambiável com Chess.com.
- Stockfish 19 lite single privado na função Vercel, chamado após lances e retomado nas consultas. Até 3 posições por execução; não é um processo 24h dedicado. Pausas de tráfego e cotas podem atrasar fila. Somente admin pode ativar/desativar ou reprocessar erros.
- Relatório privado contém melhor lance, perda em centipeões, profundidade e coincidência. Não há banimento automático por precisão. Dados da análise não saem na API de jogadores.
- Pacote stockfish 19.0.0, código e licença: https://github.com/nmrugg/stockfish.js (GPL-3.0). A engine não é copiada para a pasta pública.

### Dinheiro real — bloqueio externo
Ainda não implementado/ativado: gateway Pix, liquidação bancária, KYC e saques. Não há endpoint que transforme créditos de teste em saldo BRL.
As regras do Vercel Hobby vedam uso comercial. A lista da Stripe proíbe jogos de habilidade com prêmio monetário e cobrança de entrada vinculada a premiação. Não foi ativada cobrança, plano pago ou conta de pagamento.
Para concluir a fase financeira, é necessário provedor que confirme suporte ao modelo de xadrez com entrada e prêmio, conta comercial aprovada, credenciais privadas, webhook homologado, KYC/titularidade, política de retenção/reembolso e infraestrutura permitida para operação comercial.
Fontes: https://vercel.com/docs/plans/hobby ; https://stripe.com/legal/restricted-businesses .
