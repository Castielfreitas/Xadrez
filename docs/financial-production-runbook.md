# Go-live financeiro da Arena Xadrez — validação para produção

Esta documentação registra as etapas operacionais para um piloto com **dois jogadores humanos verificados**. Nenhum passo deve ser interpretado como aprovação de modelo de negócio pelo Asaas. Não habilitar apenas pelo valor baixo da inscrição.

## 1. Evidência externa e responsabilidades

- Obter confirmação escrita do Asaas de que a conta pode cobrar inscrições para competições de xadrez por habilidade, distribuir prêmios, movimentar carteira de usuários e realizar saques Pix.
- Verificar titularidade, situação cadastral/KYC da conta produtiva do Asaas, permissões efetivas da chave, taxas e mínimos reais de Pix/transferência.
- Obter aconselhamento jurídico e contábil sobre torneios com entrada e premiação, tributos e custódia/contabilização dos saldos.
- Manter rastreabilidade do parecer de aprovação; **nunca alterar `model_approved` manualmente sem essa evidência**.

## 2. Segredos e ambientes separados

O handler financeiro sensível está na Supabase Edge Function `arena-finance`, com configurações via RPC `arena_finance_config_read` e segredos guardados em Vault. Chaves nunca devem ir ao JavaScript ou ao repositório.

- Produção usa API `https://api.asaas.com/v3`, chave produtiva `$aact_prod_...` e token de webhook exclusivo, não a chave Sandbox.
- Sandbox usa `https://api-sandbox.asaas.com/v3`, com cobranças e webhooks próprios.
- Configurar `ASAAS_API_KEY` produtiva somente no backend/segredo autorizado. Confirmar que o backend usa a mesma conta e ambiente; jamais misturar um token de Sandbox com `environment='production'`.
- Guardar no Vault os segredos necessários para KYC, autenticação de webhook e agendamento. Preserve o material de recuperação da chave de criptografia KYC em cofre gerenciado por proprietário; perdê-la pode tornar dados anteriores irrecuperáveis.
- Registrar webhook **produtivo separado** para `https://kjqovtvhgulwufdzfmif.supabase.co/functions/v1/arena-finance?action=asaas-webhook` usando `authToken` de 32 a 255 caracteres. Validar header `asaas-access-token`; processar eventos idempotentemente e confirmar HTTP 200.
- Na migração, `webhook_registered` do Sandbox **não prova** registro em produção. O serviço exige ID registrado e prova `cash.production.webhookSetup` consistente com o ID da configuração produtiva.
- Confirmar chamadas de reconciliação cron e auditoria de mensagens órfãs, duplicadas, chargebacks, estornos e saques.

## 3. KYC e proteção das identidades

- Cada participante acessa a Arena e envia documentos pela seção de identidade no Fair Play (não enviar CPF/fotos ao ChatGPT).
- Os documentos são criptografados e armazenados em bucket privado. O usuário permanece `pending` até revisão.
- Administrador revisor distinto do titular valida dados, documento e selfie e registra justificativa. Administrador não pode aprovar a própria identidade.
- A carteira em reais exige identidade `verified`, material criptografado vigente e conta ativa.
- Verifique exclusão/retensão e controles de acesso das evidências pessoais.

## 4. Checklist de ativação

Abra **Carteira > Integração Asaas > Verificar requisitos para produção** com uma conta administradora autorizada. O endpoint privado `production-readiness` só apresenta metadados booleanos de disponibilidade e não retorna senhas ou documentos.

Somente após parecer formal, KYC concluído e testes de conciliação produtivos, validar `model_approved`, `production_enabled` e `webhook_registered` associados ao ambiente produtivo correto. Habilitar carteira e torneios reais de forma faseada. Nunca mudar esses valores para contornar requisitos.

## 5. Piloto de R$ 1,00

1. Dois usuários humanos verificados; outro administrador independente para revisar o KYC do administrador que também vai jogar.
2. Cobrança Pix de R$ 1,00 por participante **apenas se o Asaas confirmar mínimo e tarifa viáveis**.
3. Esperar `PAYMENT_RECEIVED` e confirmar pagamento real via API antes de creditar a carteira.
4. Torneio privado para dois inscritos, reserva de R$ 1,00 de cada.
5. Validar contagem, confronto, resultado, análise Fair Play, liquidação do prêmio e saldo final.
6. Validar cancelamento com devolução ao saldo da carteira e distinguir de **estorno externo do Pix**.
7. Homologar separadamente estorno externo e saída Pix, verificando confirmação `DONE`, limites, aprovações e conciliação sem duplo débito.
8. Parar os testes no primeiro resultado inconclusivo. Não permitir usuários externos enquanto houver diferenças entre extrato, provedor e banco.

Referências oficiais:
- https://docs.asaas.com/docs/prepara%C3%A7%C3%A3o-para-produ%C3%A7%C3%A3o
- https://docs.asaas.com/docs/receba-eventos-do-asaas-no-seu-endpoint-de-webhook
- https://docs.asaas.com/docs/aprova%C3%A7%C3%A3o-de-contas
- https://docs.asaas.com/docs/mecanismo-para-validacao-de-saque-via-webhooks
