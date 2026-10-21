# Integração Asaas — base técnica

O adaptador `server/asaas.js` prepara cadastro de pagadores, cobrança Pix, QR Code,
consulta de cobranças, transferência Pix CPF e autenticação de notificações.
Os testes usam um transporte simulado; nenhuma cobrança ou transferência foi realizada.

## Estado atual

Ainda não há endpoints financeiros públicos, receptor de webhook, crédito BRL ou
saque operacional. As carteiras continuam em créditos sem conversão para reais.
`paymentsEnabled` permanece falso, inclusive com credenciais configuradas.
O adaptador não foi conectado aos botões da carteira. Isto é preparação, não ativação.

## Configuração privada

Configure as variáveis exclusivamente no projeto Vercel `xadres/arena-xadrez`.
Não envie chaves no chat, em issues, PRs ou arquivos versionados.

- `ASAAS_ENVIRONMENT`: `sandbox` para homologação ou `production` para a conta real.
- `ASAAS_API_KEY`: chave da conta no ambiente correspondente, obtida em Integrações.
- `ASAAS_WEBHOOK_TOKEN`: segredo independente de 32 a 255 caracteres, sem espaços.
  Não reutilizar a chave de API. Não cadastrar webhook antes de existir seu receptor.
- `ASAAS_BUSINESS_MODEL_APPROVED`: manter `false` até a confirmação específica do
  Asaas para torneios, confrontos premiados, partidas contra computador, carteira e saques.
- `ASAAS_PRODUCTION_ENABLED`: manter `false` até homologação completa e liberação operacional.

Não usar prefixos públicos para segredos. A conta Asaas de produção e a conta Sandbox
possuem credenciais distintas. A aprovação cadastral não demonstra aprovação do modelo.

## Próxima implementação antes da ativação

1. Livro financeiro BRL independente dos créditos existentes, com reservas atômicas,
   conciliação de taxas e registro único de cada operação por usuário e chave idempotente.
2. Cadastro de pagador vinculado à identidade verificada no servidor e consentimento.
3. Criar cobrança com referência persistida antes do envio; apresentar QR Code e expiração.
4. Receptor que autentica, persiste e deduplica eventos antes de responder HTTP 200;
   consultar o pagamento no Asaas e conferir conta, cliente, referência, moeda, valor
   e status liquidado antes de creditar. Tratar devoluções e eventos fora de ordem.
5. Reservar saldo BRL antes de solicitar saque; vincular a chave CPF ao titular verificado
   no servidor, acompanhar o processamento e impedir repetição/reenvio ambíguo.
   CPF válido ou igualdade entre dois campos enviados pelo navegador não comprova titularidade.
6. Autorização por usuário e admin, tratamento de falhas e estornos, retenções e suporte.
7. Adaptar inscrições, confrontos e liquidação de prêmios para o livro BRL, sem mistura com TEST.
8. Homologar em Sandbox e verificar as condições comerciais do gateway e da hospedagem.

`externalReference` auxilia conciliação, mas não garante unicidade no Asaas.
Após timeout de POST, consultar/conferir a operação antes de reenviar: o adaptador
não repete automaticamente requisições que possam criar cobranças ou transferências.

## Documentação consultada

- https://docs.asaas.com/reference/criar-novo-cliente
- https://docs.asaas.com/reference/criar-nova-cobranca
- https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
- https://docs.asaas.com/reference/transferir-para-conta-de-outra-instituicao-ou-chave-pix
- https://docs.asaas.com/docs/sobre-os-webhooks
- https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
- https://docs.asaas.com/docs/retries-e-idempot%C3%AAncia
