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

## Supported identity documents and financial rails — 24 October 2026

The secure manual identity endpoint accepts:
- Brazilian CPF (including a foreign citizen with their own valid CPF).
- Passport, issuing country, country of residence and expiry date. Passport
  identity does not require a placeholder/fake CPF. All 249 ISO country/territory
  codes are available for identification only; this is NOT a payment coverage list.

Both use the existing private encrypted document/selfie storage, adult-age checks,
manual administrator review, audit and 30-day document retention. Passport numbers
and identity hashes are absent from public state and wallet summaries. Matching
hashes do not automatically block separate accounts. This change does not activate
or alter the optional external automated KYC service.

Identity approval and financial eligibility are separate. A reviewed passport is
not evidence that a payment provider has underwritten the business or a country.
The current server explicitly refuses deposits, withdrawals, transfers, purchases
and paid competition entries for a passport-only financial identity, before any
provider POST or wallet reservation. Free play remains available.

The domestic integration continues to support hosted card invoices (debit availability
is determined by the processor), Pix deposits, and same-holder Brazilian Pix/TED
withdrawals. Foreign-issued card acceptance requires separate Asaas authorization;
it is not established by a successful domestic card payment.

Wallet summaries expose per-identity payment method lists, `financiallyEligible`,
`financialAccessReason` and `internationalPayouts=false`. Passport-only identities
have no active deposit or payout methods. The admin wallet explains the missing
international provider; there is deliberately no fake “enable” flag.

Asaas documents a `foreignCustomer: true` registration option, subject to production
account enablement. Our current adapter still creates CPF-based domestic customers.
International charging alone would not enable international prize payouts. Do not
collect funds for a route that cannot pay out to the verified account holder.

Activation requires a provider contract covering:
1. The Brazilian operating entity and the actual chess business: player-funded
   challenges, paid tournaments, fixed prizes, commissions, wallet reuse and
   explicitly identified maximum-strength computer opponents when enabled.
2. Supported residence countries, identity documents, age and screening requirements.
3. Both card/acquirer deposits and same-holder international prize payouts.
4. Contract currencies, FX quotes/expiry, fees, chargebacks and reserve obligations.
5. Test and production credentials, signed webhooks, authoritative GET reconciliation,
   idempotency guarantees and a verified complete deposit-to-prize-to-payout flow.

Then implement that provider's actual API as a second rail, retaining Asaas. Do not
route this business through ordinary Stripe/PayPal accounts as though account
creation alone authorized games with cash prizes. Do not treat card refunds as a
way to pay winnings. No international provider is connected by this release, and
no real deposit, payout or balance adjustment was made for verification.

Primary documentation checked:
- https://docs.asaas.com/reference/criar-novo-cliente
- https://central.ajuda.asaas.com/hc/pt-br/articles/31972902909851-Como-receber-pagamentos-internacionais
- https://stripe.com/br/legal/restricted-businesses
- https://www.paypal.com/us/cshelp/article/what-gambling-activities-does-paypal-prohibit-help391
- https://www.nuvei.com/use-cases/online-gaming (candidate for underwriting, not an
  approval or a guarantee of Brazilian merchant/country eligibility)

## Tournament champions

For finished tournaments, public state exposes `awardedPrize` from the actual recorded
`prizePaid` value. The interface shows the champion and credited amount, while keeping
organizer receipts, fee calculations and profit private. Missing payout evidence is
labelled “Prize awaiting confirmation”; the advertised prize is not used as proof of
credit. Past tournament and wallet records are not fabricated or backfilled.
