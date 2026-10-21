# Recursos da Arena

| Recurso | Estado |
|---|---|
| Regras, relógio, incremento, promoção, roque, empate/revanche | Implementados |
| Último lance, animação, som, xeque, xeque-mate e histórico | Implementados; lances abertos na lateral com opção de recolher, peças vetoriais próprias, destruição da peça capturada em fragmentos e aviso de mate |
| Computador com oito dificuldades, cores, desfazer, PGN | Implementados; avatar próprio, controles sem card duplicado, não usa Elo oficial |
| Matchmaking grátis e com entrada | Implementado com saldo de teste; tempos e incrementos selecionáveis, filas distintas com/sem rating |
| Rating por ritmo e ranking | Glicko-2; provisório identificado por ? |
| Nome, usuário único, foto, perfil e partidas recentes | Implementados |
| Busca de jogadores, presença, amizades, bloqueio e convite privado | Implementados |
| Torneios eliminatórios, faixas verificadas e gestão administrativa | Implementados; câmera ainda bloqueia início por falta de integração |
| Taxa e prêmio automáticos | Livro de créditos de teste; liberação condicionada à análise e ausência de restrições |
| Análise privada de lances | Stockfish 19; sem sugestões públicas ou banimento por coincidência isolada |
| Revanche voluntária após vitória/derrota entre usuários | Pendente; a repetição após empate já existe |
| E-mail de confirmação com identidade própria via SMTP | Pendente; aviso de confirmação no cadastro implementado |
| Chat privado/clubes/equipes | Pendente |
| Puzzles, aulas e biblioteca de cursos | Pendente |
| Análise pós-partida interativa do jogador | Pendente; precisa ficar isolada da análise privada durante o jogo |
| Variantes, suíço, arenas, simultâneas e correspondência | Pendente |
| CPF/KYC manual e quadros privados de câmera | Código preparado, aguardando configuração e validação em produção; ver SEGURANCA.md |
| Pix, saque e operação em dinheiro real | Não integrados |
| Publicação Google Play e assinatura Android | Pendente |

A Arena tem identidade e código próprios. Esta lista não representa paridade integral com Chess.com.

## Configuração e finais de partida

Configuração de computador e busca online ficam em painel lateral fixo junto à prévia do tabuleiro. Promoção oferece quatro peças identificadas individualmente para ambas as cores. Afogamento mostra empate explícito; em confrontos online, a repetição preserva a causa do empate e as reservas. Movimento visual de 520 ms e resposta do computador com intervalo mínimo de 620 ms. O tabuleiro usa uma área maior com controles na lateral, preservando as casas clicáveis sem perspectiva inclinada.

## Sandra e som de arrasto

- Movimento: fricção sintetizada por 480 ms e pouso suave, acompanhando a animação. Captura mantém impacto próprio.
- Sandra é uma conta de sistema explicitamente identificada como computador Stockfish. Skill 20, UCI_LimitStrength=false, Hash 32 MB, 1 thread, busca de 1,5 s/lance (não representa força ilimitada nem Elo garantido).
- Admin habilita desafios e novos torneios separadamente; ambos vêm desligados. Alterações não interrompem partidas já aceitas.
- Saldo próprio abastecido por transferência da carteira demonstrativa do admin, sem emissão de créditos. As duas entradas são reservadas; prêmio e comissão seguem a taxa fixada no aceite. Não aceita entrada sem cobertura.
- Escolha e aceite explícitos para enfrentar Sandra; busca de humanos não é substituída silenciosamente por bot. Torneios exibem a inscrição da Sandra desde a criação e exigem aceite ao entrar. Um torneio com Sandra pode ter faixas humanas de rating; bot não é considerado humano dessa faixa.
- Partidas contra Sandra não alteram rating humano; bot fora do ranking humano. Empate preserva reserva e abre nova partida.
- Lances são calculados e validados no servidor, com lease, compare-and-swap e verificação da posição antes da aplicação. O navegador não escolhe lances da Sandra. Polling autenticado aciona os trabalhos; não há promessa de processamento contínuo sem clientes conectados.
- Identidade e câmera continuam exigidas para humanos quando ativadas. A conta reservada do bot é isenta desses requisitos humanos.
- Somente sandbox. Dinheiro real/Pix continuam desativados; esta implementação não homologa pagamentos nem apostas reais.

## Resultado, capturas e personalização

- Deslocamento de peças: 280 ms; espera mínima do treino local: 360 ms. Arrasto com 260 ms, ruído filtrado mais suave e pouso discreto.
- Resultado em janela central uma vez por conclusão, com vitória/derrota/empate e motivo; homologação continua indicada quando aplicável.
- Peças efetivamente capturadas aparecem no cabeçalho de quem capturou. Inclui en passant e acompanha navegação do histórico e desfazer lances.
- Comissão e prêmio líquido calculado aparecem na configuração da entrada; a busca deixa de repetir a comissão.
- Avatar da Sandra: imagem escolhida e preparada pelo admin, envio pela API autenticada, JPEG até 512 px/32 KB no bucket de avatares, pasta reservada arena-sandra. Só admin pode alterar/restaurar; perfil continua identificado como computador nos aceites e torneios.

## Torneios: criação, prêmio e capas

- Meus confrontos tem página própria e item na lateral, imediatamente após Fair play. Não duplica a lista na página inicial ou nos torneios.
- Criar torneio abre página com rolagem normal, horário futuro sugerido, validação visível e campos preservados durante polling. A fiscalização não configurada fica desabilitada no formulário.
- Quatro capas originais selecionáveis: Coroa dourada, Noite azul, Clube clássico e Blitz de cobre. Os cartões usam a capa salva.
- Prêmio mínimo garantido configurável em créditos de teste. O organizador reserva a garantia inteira ao publicar; ao fim só é consumida a diferença necessária para alcançar o prêmio mínimo, e o excedente reservado é devolvido. Se as inscrições líquidas superarem a garantia, o prêmio cresce. Cancelar devolve garantia e inscrições. Não há emissão de saldo nem premiação sem cobertura.
- Marcação explícita de torneio de teste. Criar e cancelar seguem exclusivos da administração autenticada.

## Torneios de prêmio fixo
Novos torneios criados pelo formulário usam inscrição e prêmio fixos. O administrador digita entre 2 e 1024 vagas e vê arrecadação atual e projeção após o prêmio. O público recebe apenas as informações de participação e prêmio, sem comissão ou demonstrativo financeiro. Torneios antigos conservam seu contrato e reserva de prêmio.

No horário previsto, a próxima requisição à API dispara uma tentativa atômica de início: com pelo menos dois participantes e arrecadação estritamente superior ao prêmio, inicia mesmo abaixo da lotação. Caso contrário, cancela e devolve os saldos. Se um participante estiver ocupado, aguarda nova tentativa. Não há relógio dedicado sem tráfego no plano gratuito. Vagas ímpares recebem avanço de rodada sem partida e sem alteração de rating.

O campeão recebe exatamente o prêmio fixo e o excedente vai para a carteira administrativa da plataforma. Tudo permanece em créditos TEST, sem dinheiro real. Eliminados podem comprar outra inscrição enquanto o campeonato estiver em andamento e houver vagas de inscrição; entram na próxima rodada sem modificar jogos em curso. A pontuação do campeonato zera; rating geral é preservado. O total de inscrições inclui reinscrições.

Capas: seis imagens originais, mais upload administrativo JPEG/PNG/WebP de até 5 MB, convertido no navegador a JPEG de até 512 pixels e 32 KB, com validação no servidor. Apenas a administração pode enviar; caminhos de capa ficam limitados ao espaço do próprio administrador no bucket público de imagens.
