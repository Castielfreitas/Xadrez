# Carteira Asaas — implementação e ativação

A chave deve existir somente em `xadres/arena-xadrez`, como Secret de Production.
Nunca cole credenciais no chat, código, logs ou issues. Nenhuma cobrança ou transferência
real foi realizada nos testes desta implementação.

## Entregue no código

- Livro BRL separado por ambiente e separado dos créditos antigos, sem conversão.
- Reserva atômica por revisão do estado, idempotência local e referência persistida
  antes de POST. Falhas ambíguas ficam em conciliação; POST não é reenviado.
- Cadastro Asaas com identidade previamente verificada pelo administrador e cifrada,
  CPF e nome obtidos no servidor, e-mail da sessão confirmada e consentimento explícito.
- Cobrança Pix, QR Code e copia e cola; crédito somente no status RECEIVED consultado
  no Asaas, com cliente, referência, tipo e valor conferidos. CONFIRMED não credita.
- Webhook autenticado, persistência e deduplicação antes do HTTP 200; processamento
  posterior consulta os dados oficiais. Notificações não comprovam pagamento sozinhas.
- Registro das taxas do provedor; o usuário recebe o valor bruto. Custos são da plataforma.
- Saque reservado antes da aprovação administrativa; Pix somente para CPF verificado
  do titular. DONE consome reserva; FAILED/CANCELLED devolvem uma única vez.
- Devolução integral reverte crédito uma vez; saldo devedor e devoluções parciais entram
  em revisão. Não há desbloqueio automático de carteiras em revisão.
- Interface de carteira, acompanhamento de recargas/saques e revisão administrativa.
- Dados financeiros excluídos do estado público; consultas privadas por proprietário/admin.

## Rotas

Todas estão em `/api/index?action=...`, com Cache-Control no-store.

| Ação | Método | Acesso |
| --- | --- | --- |
| wallet-summary | GET | Sessão confirmada, carteira própria; admin vê operações |
| wallet-deposit | POST | Sessão, identidade verificada recente e consentimento |
| wallet-pix&id=UUID | GET | Titular da cobrança |
| wallet-withdraw | POST | Titular, identidade, consentimento e saldo BRL |
| wallet-withdraw-decision | POST | Admin, approve ou reject |
| asaas-status&check=true | GET | Admin; consulta conexão sem criar operação |
| asaas-webhook | POST | Token independente em asaas-access-token |

Webhook de produção: `https://arena-xadrez.vercel.app/api/index?action=asaas-webhook`.
Cadastre apenas após verificar a publicação do receptor. Eventos de pagamentos e
transferências devem ser enviados na versão de API compatível com os campos usados.

## Configuração privada

- `ASAAS_ENVIRONMENT`: sandbox ou production. Na ausência, pode ser inferido do prefixo
  oficial da chave. Prefixo e ambiente contraditórios bloqueiam a integração.
- `ASAAS_API_KEY`: chave do ambiente correspondente; nunca exposta ao navegador.
- `ASAAS_WEBHOOK_TOKEN`: segredo independente, 32–255 caracteres, sem espaços.
  Cadastre exatamente o mesmo valor no webhook Asaas; não reutilize a chave API.
- `KYC_ENCRYPTION_KEY`: 32 bytes aleatórios em hexadecimal (64 caracteres) ou base64.
  Preserve esta chave: sua troca sem migração torna documentos anteriores ilegíveis.
- `ASAAS_BUSINESS_MODEL_APPROVED`: false até confirmação específica do Asaas para
  torneios/confrontos premiados, computador, carteira e saques. Cadastro aprovado não
  equivale à aprovação deste modelo.
- `ASAAS_PRODUCTION_ENABLED`: false até liberação operacional.
- `ASAAS_WALLET_ENABLED`: false até concluir homologação e itens abaixo.

Em sandbox também são necessários webhook, criptografia e flag de carteira. Consultas
administrativas ao provedor funcionam com chave válida mesmo com pagamentos desligados.
Salvar variáveis exige nova implantação para surtir efeito. Não usar prefixos públicos.

## Pendências antes de liberar dinheiro real

1. Configurar webhook e criptografia e homologar recarga, duplicatas, devolução, saque
   aprovado/recusado/falho e interrupção de rede em conta Sandbox separada.
2. Adaptar inscrições, confrontos e liquidação de prêmios ao livro BRL. Os jogos atuais
   continuam usando créditos antigos; a carteira informa a separação explicitamente.
3. Conciliação operacional de solicitações incertas, varredura agendada independente
   de tráfego, custos de saque e saldo disponível do provedor. O worker atual processa
   até dois eventos por execução e é reativado por webhooks e acessos autenticados.
4. Reconciliar os custos do provedor com a carteira administrativa e garantir liquidez
   antes de liberar saques. Não permitir retirada de receita bruta como lucro.
5. Confirmar aceitação do modelo pelo Asaas e condições comerciais da hospedagem.
   O plano Hobby da Vercel exige revisar a elegibilidade para uso comercial.
6. Monitoramento, atendimento a disputas/devoluções e procedimentos de revisão.

Não habilitar apenas por existir chave API. Esta entrega é uma carteira protegida por
flags, ainda sem homologação bancária nem ativação dos confrontos em reais.

## Documentação oficial

- https://docs.asaas.com/reference/criar-novo-cliente
- https://docs.asaas.com/reference/criar-nova-cobranca
- https://docs.asaas.com/reference/obter-qr-code-para-pagamentos-via-pix
- https://docs.asaas.com/reference/transferir-para-conta-de-outra-instituicao-ou-chave-pix
- https://docs.asaas.com/reference/recuperar-saldo-da-conta
- https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
- https://docs.asaas.com/docs/retries-e-idempot%C3%AAncia
