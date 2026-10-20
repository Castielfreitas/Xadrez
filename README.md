# Arena Xadrez

Plataforma de validação para desafios de xadrez e torneios eliminatórios. Primeira versão em créditos demonstrativos, sem dinheiro real.

## Código-fonte

O código completo está no arquivo `arena-xadrez-v0.2-codigo.zip` na raiz deste repositório. Extraia o ZIP em uma pasta antes de executar os comandos abaixo.

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
- `worker/`: análise Stockfish privada, separada da API de jogo.
- `android/`: aplicativo Android WebView com origem HTTPS restrita e proteção FLAG_SECURE.
- `tests/`: reservas, aceite, legalidade de lances, relógio, revanche, homologação, permissões e mata-mata.

## Implantação

Vercel: `npm run build`, saída `dist`, API Node em `api/index.js`.
Supabase: siga [docs/OPERACAO.md](docs/OPERACAO.md). Nunca coloque SUPABASE_SERVICE_ROLE_KEY no cliente.

## Limitações

Esta versão não está pronta para movimentar dinheiro real. Pix, KYC, integração Lichess, câmera e banimento automático não estão integrados. O worker Stockfish precisa de host próprio; a fila não significa que a engine está rodando. A demonstração local não conecta dois dispositivos. O modo online exige configurar o Supabase.

A publicação na Google Play depende das políticas da loja; o modelo com apostas/inscrições e prêmio monetário não tem elegibilidade presumida. Veja o documento operacional para a lista completa de implementações e pendências.


## Versão 0.2

Computador com 8 níveis, cores e ritmos; busca de adversários grátis; incremento; Elo Arena; aviso persistente de confirmação e reenvio. O modelo de e-mail português está preparado; sua aplicação depende de SMTP próprio ou Pro no Supabase. Nenhum plano pago foi ativado.
