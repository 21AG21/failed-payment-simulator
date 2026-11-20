# Failed payment simulator

A small learning project about failed subscription payments.

## What it does

- **Live Stripe test** (`index.html`): pick a Stripe test card and press Charge. A small server function asks Stripe to charge it. The page shows the real error code Stripe sends back and picks what to do next: retry later, or ask the customer for a new card.
- **Strategy simulator** (`strategy.html`): 2,000 made-up failed payments. Set when to retry and when to email for each kind of failure, and see how much money each plan wins back.

## How it works

- `api/charge.js` is one Vercel function. It creates a $20 PaymentIntent in Stripe test mode with one of Stripe's built-in test cards.
- It refuses to run with a live key, the amount is fixed, and only the listed test cards can be charged.
- The pages are plain HTML, CSS and JavaScript with no build step.

## Run your own copy

1. Put this repo on Vercel.
2. Add an environment variable named `STRIPE_SECRET_KEY` with a Stripe sandbox key that starts with `sk_test_`.
3. Redeploy.

## Limits

- No real money moves. Everything runs in Stripe test mode.
- The retry rules in the strategy simulator are made up to show the trade-offs. They are not real bank data.
- This project is not affiliated with Stripe or Subcraft.
