# Integração financeira Arena Xadrez

Projeto exclusivo Supabase: `kjqovtvhgulwufdzfmif`, organização Arena Xadrez.
Nenhum recurso do StudyWise é utilizado. Não guardar credenciais no Git, chat ou logs.

## Componentes

- `server/finance-handler.js`: API financeira e de identidade em Supabase Edge Functions.
- `server/payments.js`: recargas Pix/cartão, saques Pix CPF, webhook persistente e conciliação.
- `server/cash-ledger.js`: livro em centavos com ambientes independentes, idempotência e CAS.
- `src/game-cash.js`: reservas por mesa/torneio, prêmio e receita administrativa em BRL.
- `server/finance-access.js`: permissões e bloqueios de admissão em reais, sem confiar no cliente.
- `server/identity.js`: AES-256-GCM, CPF único por HMAC e arquivos privados, com revisão humana.
- `supabase/finance-setup.sql`: Vault, configuração privada e agendamento a cada minuto.
- `scripts/build-finance.mjs`: gera um pacote reproduzível para publicar a função.

Site Vercel continua servindo tabuleiro, partidas gratuitas e análise Stockfish. A carteira,
KYC e comandos que movimentam mesas BRL usam a função quando sua consulta health é válida.
Não existe reenvio automático de POST financeiro pela troca de endpoint ou por timeout.

## Endpoints

Base: `https://kjqovtvhgulwufdzfmif.supabase.co/functions/v1/arena-finance`

| action | Método | Autorização |
| --- | --- | --- |
| health | GET | Metadados públicos, sem segredos |
| wallet-summary | GET | JWT de usuário confirmado e ativo |
| wallet-deposit | POST | Titular verificado, consentimento e flags |
| wallet-pix / wallet-checkout | GET | Titular da cobrança |
| wallet-withdraw | POST | CPF verificado do titular e saldo disponível |
| wallet-withdraw-decision | POST | Administrador; reserva antes do envio |
| wallet-platform-transfer | POST | Administrador verificado; somente receita líquida |
| command | POST | JWT; permissões do domínio e contexto financeiro do servidor |
| identity-submit | POST | Titular e consentimento; arquivos privados e cifrados |
| trust-evidence | GET | Administrador; acesso auditado; prazo de 30 dias |
| finance-register-webhook | POST | Administrador; criação reivindicada antes do POST |
| asaas-webhook | POST | Token independente em asaas-access-token |
| reconcile | POST | Token exclusivo do worker, armazenado no Vault |

Desativar a verificação *legacy* no gateway apenas nesta função: a implementação valida
`auth.getUser` e e-mail confirmado nas rotas de usuário e tokens próprios nas outras rotas.
Não usar `user_metadata` para conceder administração. CORS não substitui autenticação.
As funções SQL que leem Vault recusam JWT sem papel service_role; anon/authenticated
não possuem EXECUTE. A configuração fica em schema privado com RLS.

## Regras financeiras

Créditos antigos nunca viram reais. Mesas BRL guardam moeda e ambiente desde a criação.
Cada operação só consome a reserva da própria mesa; saques não usam reservas de partidas.
Empates preservam fundos. Cancelamentos/ausência e inscrições sem arrecadação suficiente
retornam fundos. Torneio de prêmio fixo exige pelo menos dois inscritos e arrecadação
estritamente maior que o prêmio. Reinscrição paga nova entrada e zera a pontuação.

Prêmios e receita são contabilizados na mesma transação CAS. Fair play pendente ou
carteira congelada impede liberação. A admissão BRL exige análise de fair play ativada.
A receita administrativa pertence ao livro da plataforma; o admin só transfere receita
líquida após descontar custos de processamento. Depois solicita saque pela própria
carteira e CPF verificado. Não há retirada de fundos reservados como receita.

Pix e cartão creditam apenas RECEIVED consultado no Asaas, uma única vez. CONFIRMED
não libera fundos. Contestação congela carteira. Cartão usa invoiceUrl oficial HTTPS,
validada por ambiente; PAN/CVV ficam no Asaas. Débito depende da disponibilidade da
fatura hospedada. Saques implementados: Pix CPF; não existe saque para cartão.

Solicitações ambíguas nunca repetem POST. O worker consulta GET por ID/referência,
valida valor, moeda, cliente e referência e reprocessa eventos perdidos. Operações não
localizadas permanecem sob conciliação; não se presume que uma falha de rede cancelou
uma cobrança/transferência. Revisão de saques é administrativa, não um envio bancário
irrestrito e automático. Custos, disputas e liquidez precisam ser homologados na conta.

## Configuração e homologação

1. Publicar `supabase/finance-setup.sql` somente no Arena. Ele gera no Vault três segredos
   aleatórios (KYC, webhook e worker), sem revelar valores; reaplicação preserva chaves.
2. `npm run build:finance`; publicar `supabase/functions/arena-finance/index.ts`.
3. Cadastrar `ASAAS_API_KEY` **Sandbox** em Edge Functions → Secrets. Não reutilizar chave
   de produção em Sandbox. A conta Asaas Sandbox é independente da conta de produção.
4. Entrar com administrador (`geova0448@gmail.com`, lista privada configurável no banco),
   abrir Carteira e conferir o webhook. O worker o registra automaticamente uma única vez quando a chave correta está configurada; há também um botão administrativo. A função envia o token diretamente ao Asaas.
   Se a resposta for ambígua, conferir no provedor antes de criar qualquer outro webhook.
5. Testar com usuários e identidades destinados à homologação: recarga, duplicatas,
   cartão confirmado/recebido, contestação, saques aprovados/recusados/falhos, perda de
   conexão, cancelamentos, vitória, empate, torneio lucrativo e devolução por margem.
   O teste automatizado de provedor `node scripts/homologate-asaas.mjs` só aceita Sandbox,
   usa dados sintéticos e não altera o banco da Arena. Ele não comprova saque nem webhook:
   esses resultados são informados separadamente, sem aprovação automática de produção.
6. Só depois de homologar, registrar aceitação específica do modelo de negócio pelo
   Asaas e revisar as condições da hospedagem. Cadastro aprovado não equivale a esse aceite.
7. Ambiente, flags e lista administrativa ficam em `arena_private.finance_config`:
   `environment`, `wallet_enabled`, `games_enabled`, `model_approved`, `production_enabled`.
   Tudo começa desligado. Produção exige todas as condições; Sandbox também exige chave,
   webhook registrado e criptografia. Nunca alterar flags para mascarar pendências.

KYC aqui é coleta privada com revisão humana. Não é consulta governamental, reconhecimento
facial automatizado nem prova de vida. O titular deve fornecer os documentos reais;
nenhum agente deve inventar ou aprovar evidências. Após 30 dias, renovar os documentos.
Fiscalização por câmera continua no backend de partidas e exige configuração própria;
o KYC financeiro não ativa a câmera nem compartilha a chave automaticamente com Vercel.

## Estado verificado da implantação — 23/10/2026

- Ambiente privado alterado para `production`; ledger Sandbox preservado e separado.
- Chave produtiva já existente na Vercel validada por GET no Asaas e importada diretamente
  para o Vault pelo servidor, sem exibir seu conteúdo. A conta retornou `general=APPROVED`.
- Webhook produtivo registrado com token próprio, separado do Sandbox. Corrigida a URL
  canônica pública: o endereço interno de requisições Edge não serve como callback.
- Conciliação produtiva respondeu HTTP 200 e registrou `last_worker_status=ok`.
- Flags de carteira, jogos e autorização do proprietário estão ligadas. `model_approved`
  permanece falso: a aprovação específica da operação comercial não foi confirmada.
  Assim, o health declara produção, mas não permite operações financeiras reais ainda.
- Nenhum depósito, saque ou transferência bancária real foi executado pelo agente.
- Identidades continuam com aprovação manual administrativa por usuário.
- A interface e os testes de Stockfish local foram publicados na Vercel. Teste real de
  treino: `1. e4 e6 2. d4 d5 3. exd5 exd5`, nível máximo, sem transações.

`supabase/production-key-import.sql` permite apenas importação única por service role,
com carteira desligada e ainda no Sandbox; fecha ao mudar para produção. Não substitui
credenciais existentes. A rota de preparação também recusa execução após a mudança.
Transferências entre jogadores (`wallet-transfer`) usam o saldo BRL liquidado, exigem
identidade de ambos, recusam bots/carteiras congeladas e gravam débito/crédito em uma
única revisão atômica, com referência idempotente. Inscrições usam o mesmo saldo.
Recargas com cartão seguem a fatura hospedada no Asaas; saques seguem via Pix CPF.
