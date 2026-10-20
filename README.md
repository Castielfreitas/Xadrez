# Arena Xadrez

Plataforma de validação para desafios de xadrez e torneios eliminatórios. Primeira versão em créditos demonstrativos, sem dinheiro real.

## Código-fonte

O código atual está nas pastas deste repositório. Os ZIPs na raiz são versões antigas; use a branch main para executar e publicar.

## Executar

Node.js 22+.

```sh
npm ci
npm test
npm run build
npm run dev
```

Abra http://localhost:3000. Sem Supabase, a interface abre uma demonstração local explícita com perfis fictícios. Troque de perfil no canto inferior da barra lateral para testar os dois jogadores ou a administração. No celular, use o botão de perfil que aparece na carteira. O tabuleiro livre permite jogar com as duas cores no mesmo aparelho.

## Arquitetura

- `src/domain.js`: regras compartilhadas e comandos imutáveis/idempotentes.
- `api/index.js`: API Vercel com autenticação Supabase, autorização administrativa e persistência concorrente.
- `src/app.js`, `public/`: cliente responsivo e PWA.
- `supabase/schema.sql`: armazenamento sandbox com RLS e compare-and-swap restrito ao servidor.
- `server/analysis.js`: Stockfish 19 privado via UCI, executado após os lances.
- `server/avatar.js`: validação e armazenamento de fotos JPEG no namespace da conta autenticada.
- `src/social.js`: nomes de usuário, presença e regras compartilhadas da comunidade.
- `android/`: aplicativo Android WebView com origem HTTPS restrita e proteção FLAG_SECURE.
- `tests/`: reservas, aceite, legalidade de lances, relógio, revanche, homologação, permissões e mata-mata.

## Implantação

Vercel: `npm run build`, saída `dist`, API Node em `api/index.js`.
Supabase: siga [docs/OPERACAO.md](docs/OPERACAO.md). Nunca coloque SUPABASE_SERVICE_ROLE_KEY no cliente.

## Limitações

Esta versão não está pronta para movimentar dinheiro real. Pix, KYC, integração Lichess, câmera e banimento automático não estão integrados. O Stockfish privado roda nas funções do servidor. A fila é retomada por requisições e pela rotina de recuperação em `supabase/analysis-cron.sql`, dentro dos limites de execução da infraestrutura. A demonstração local não conecta dois dispositivos. O modo online exige configurar o Supabase.

A publicação na Google Play depende das políticas da loja; o modelo com apostas/inscrições e prêmio monetário não tem elegibilidade presumida. Veja o documento operacional para a lista completa de implementações e pendências.


## Versão 0.2

Computador com 8 níveis, cores e ritmos; busca de adversários grátis; incremento; Elo Arena; aviso persistente de confirmação e reenvio. O modelo de e-mail português está preparado; sua aplicação depende de SMTP próprio ou Pro no Supabase. Nenhum plano pago foi ativado.

## Perfis e comunidade

Rating Glicko-2 por ritmo ao lado dos nomes; ranking por bullet, blitz, rápido e clássico. Nome de exibição editável e @usuário único (3–24 letras, números ou sublinhado). Foto de perfil recortada no navegador para JPEG 128×128; o servidor valida tipo, dimensões e limite de 32 KB. Upload autenticado para `arena-avatars`, sem políticas de escrita pública. Fotos são públicas por definição; nunca envie documentos de identidade como avatar. O bucket é criado pela API privilegiada no primeiro envio. A CSP autoriza apenas a origem do projeto Arena.

Jogadores podem enviar, aceitar, recusar e cancelar solicitações, remover amizade, bloquear/desbloquear, pesquisar nomes e convidar uma conta específica. Só remetente e destinatário veem o convite; só o destinatário pode aceitá-lo. Convites expiram em cinco minutos. Entrada e taxa são visíveis antes de reservar o saldo do destinatário; recusa/cancelamento devolve o saldo reservado do criador. Valores continuam sendo de teste.

O perfil público lista partidas recentes para assistir ou rever. Treinos contra o computador não alteram rating e não recebem um Elo inventado para o motor. Veja `docs/RECURSOS.md` para o escopo e as lacunas.
