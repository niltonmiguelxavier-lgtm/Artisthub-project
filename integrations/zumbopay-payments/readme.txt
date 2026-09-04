=== ZumboPay Payments ===
Contributors: zumbopay
Tags: payments, mpesa, emola, mastercard, visa, mozambique, south africa, woocommerce, recurring, subscriptions
Requires at least: 5.8
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPL-2.0+

Aceite pagamentos M-Pesa, e-Mola e Visa/Mastercard (MPGS) no WordPress e WooCommerce via ZumboPay.
Suporte a pagamentos únicos e recorrentes (cartão) com aceite de mandato.

== Description ==
Plugin oficial ZumboPay para WordPress / WooCommerce. PT + EN-ZA. Apenas produção.

Métodos:
* **M-Pesa** — MZN, STK Push (exige telefone).
* **e-Mola** — MZN, STK Push (exige telefone).
* **Visa / Mastercard (MPGS)** — MZN e ZAR, 3DS inline no /pay/{reference}. Suporta cobrança recorrente com mandato.

Recorrência (cartão):
* Cliente escolhe periodicidade: diária, semanal, mensal, trimestral, semestral ou anual.
* Aceite explícito do mandato (checkbox) + link para termos.
* Cobranças subsequentes disparadas pelo cron `recurring-billing-runner` do ZumboPay (03:05 diário).

Segurança do webhook (5 camadas):
1. HMAC SHA-256 sobre `${X-Timestamp}.${rawBody}`.
2. Janela de 5 minutos anti-replay.
3. Idempotência por `event_id`.
4. Re-verificação autoritativa via `GET /api/v1/payments/{reference}`.
5. Cross-check de amount + currency contra a encomenda.

== Configuração ==
1. Copiar `zumbopay-payments/` para `wp-content/plugins/` e activar.
2. WooCommerce → Pagamentos → **ZumboPay**:
   * Colar `API Key` (`zp_live_...`) de https://zumbopay.com/app/developers.
   * (Opcional) `Wallet Code` (ex.: 553009). Se vazio, usa a carteira predefinida.
   * Marcar métodos: M-Pesa / e-Mola / Cartão.
   * Ativar recorrência e colar URL dos Termos.
   * Guardar → copiar o Webhook Secret gerado + o URL `/wp-json/zumbopay/v1/webhook`.
3. No painel ZumboPay → Programadores → Webhooks:
   * URL: colar `https://loja.com/wp-json/zumbopay/v1/webhook`.
   * Secret: colar o secret guardado no plugin.

== Changelog ==
= 1.2.0 =
* Lançamento: M-Pesa, e-Mola, cartões (MPGS), recorrência com mandato.
* Compat Checkout Clássico + Blocks + HPOS.
* Webhook HMAC + reverificação autoritativa.
