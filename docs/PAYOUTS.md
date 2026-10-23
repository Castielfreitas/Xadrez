# Payment coverage and release validation

## Implemented rails

- Deposits: Pix and hosted Asaas card invoice. The invoice accepts credit and, when available for the card/account, debit. Card details never transit Arena servers, browser storage or logs.
- Withdrawals: Pix to the verified holder's CPF key; TED to a Brazilian bank account. The account owner name and CPF are taken exclusively from current server-side KYC.
- TED asks for bank code, agency and optional agency digit, account and account digit, checking/savings type. The holder authorizes transmission of bank details to Asaas. Account data is encrypted at rest with the existing KYC key. Only the rail and masked account are exposed in the private wallet/admin review.
- Admin approval reserves funds until provider confirmation. Settlement and refunds are idempotent. The existing minute worker and authenticated webhooks reconcile DONE/FAILED/CANCELLED. Ambiguous submissions are recovered through GET, never repeated blindly.
- Recovery checks operationType, holder CPF, bank, branch, account, digits and account type against the encrypted destination. A mismatch holds the reservation for review.

## Explicitly unavailable

- Card payouts and cross-border bank payouts: Asaas provides no implementation for these. No fake options, refund-as-payout, or fallback to Pix is offered.
- Foreign users without Brazilian CPF: current financial identity remains domestic. Requires a provider supporting foreign KYC, relevant countries/currencies, and this specific paid chess/prize business model. Provider account and underwriting cannot be replaced by an application flag.
- Fully embedded debit checkout: Asaas's documented flow requires invoiceUrl. Credit has a direct API, but adopting it requires a separate PCI-scoped card-data flow and validation; this release retains hosted processing for both card types.

## Validation limits

Automated tests cover domestic payout creation, privacy, same-holder enforcement, concurrency/idempotency, ambiguous submission recovery, authoritative webhooks, duplicate settlement and failed payout return. They use fixtures and do not prove a real bank has received funds. Release verification does not send real money or approve real player withdrawals.

## Primary documentation

- https://docs.asaas.com/docs/cobrancas-via-cartao-de-credito
- https://docs.asaas.com/docs/transferencia-para-contas-de-outra-instituicao-pix-ted
- https://docs.asaas.com/reference/transferir-para-conta-de-outra-instituicao-ou-chave-pix
- https://central.ajuda.asaas.com/hc/pt-br/articles/32059697584027-Posso-solicitar-uma-transfer%C3%AAncia-internacional-para-minha-conta

## Computer participation in BRL tournaments

An administrator may include the explicitly identified Casandra computer when the tournament computer setting is enabled. Its entry is funded from the creating administrator's verified BRL wallet, reserved in the tournament, and counted only after funding. Cancellation returns the computer entry to that sponsor; a computer championship prize is credited to the same sponsor wallet. Human prizes are unaffected. Computer rounds do not change human rating. No artificial computer KYC record or conversion of test credits is used. The public registration disclosure states who receives a computer prize. This release does not create or enter any real paid tournament.
