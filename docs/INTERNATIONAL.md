# International interface and payout scope

The interface negotiates `navigator.languages` against Portuguese, English, Spanish,
French, German and Italian. Unsupported browser languages fall back to English.
A manual selector persists in `arena-language`; “Automatic” restores negotiation.
Navigation, core play and wallet copy, and all lesson titles/instructions/explanations
are bundled locally. Uncatalogued text remains in its source language. Player names,
tournament names, input values, notation and authoritative financial amounts are never
sent to a translation service. Language changes do not convert BRL into another currency.

## Production financial state

The owner explicitly requested `model_approved=true` on 23/10/2026. It was enabled and
audited as an owner instruction, not as independently verified provider contract approval.
The finance health now reports production with both payments and BRL games enabled.
Individual identity checks, available-funds checks and withdrawal approval still apply.

## Supported payout rails

Asaas card charging is implemented through the hosted invoice. Its transfer endpoint
supports Brazilian bank transfers (Pix/TED), not withdrawal of winnings to arbitrary
credit cards. The current application payout rail is CPF Pix; unsupported CARD requests
fail before funds are reserved, rather than falling back to another destination.
Wallet summaries disclose `payoutMethods=['PIX']`, `depositMethods=['PIX','CARD']` and
`internationalPayouts=false`. KYC/BRL movement still requires a Brazilian CPF.

Relevant primary documentation checked:
- https://docs.asaas.com/reference/transfer-to-another-institution-account-or-pix-key
- https://central.ajuda.asaas.com/hc/pt-br/articles/32059697584027-Posso-solicitar-uma-transfer%C3%AAncia-internacional-para-minha-conta
- https://docs.asaas.com/reference/estornar-cobranca

A card refund reverses an eligible original charge. It does not pay out tournament
winnings and cannot safely be used as a replacement for a payout provider. International
payouts need a contracted provider supporting the platform country, recipient countries,
identity documents and eligible payout methods. No external payout account was created
or linked, and no live financial transaction was executed by this change.

## Tournament champions

For finished tournaments, public state exposes `awardedPrize` from the actual recorded
`prizePaid` value. The interface shows the champion and credited amount, while keeping
organizer receipts, fee calculations and profit private. Missing payout evidence is
labelled “Prize awaiting confirmation”; the advertised prize is not used as proof of
credit. Past tournament and wallet records are not fabricated or backfilled.
