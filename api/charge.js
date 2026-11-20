/* POST /api/charge   body: { "card": "funds" }

   Tries a $20 charge on one of Stripe's built-in test cards and sends back
   Stripe's real answer. Test mode only: it refuses to run with a live key,
   the amount is fixed, and only the cards listed here can be charged. */

const CARDS = {
  ok:      'pm_card_visa',
  funds:   'pm_card_visa_chargeDeclinedInsufficientFunds',
  expired: 'pm_card_chargeDeclinedExpiredCard',
  bank:    'pm_card_visa_chargeDeclined',
  network: 'pm_card_chargeDeclinedProcessingError',
  lost:    'pm_card_visa_chargeDeclinedLostCard',
  fraud:   'pm_card_radarBlock',
  cvc:     'pm_card_chargeDeclinedIncorrectCvc'
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!/^(sk|rk)_test_/.test(key)) {
    return res.status(500).json({ error: 'The server has no Stripe test key yet. Set STRIPE_SECRET_KEY to a key that starts with sk_test_.' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = null; } }
  const card = body && typeof body.card === 'string' ? body.card : '';
  const pm = Object.prototype.hasOwnProperty.call(CARDS, card) ? CARDS[card] : null;
  if (!pm) return res.status(400).json({ error: 'Unknown test card.' });

  const params = new URLSearchParams();
  params.set('amount', '2000');
  params.set('currency', 'usd');
  params.set('payment_method', pm);
  params.set('confirm', 'true');
  params.append('payment_method_types[]', 'card');
  params.set('description', 'Failed payment simulator (test mode)');

  let data;
  try {
    const r = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    data = await r.json();
  } catch (e) {
    return res.status(502).json({ error: 'Could not reach Stripe. Try again.' });
  }

  if (data && data.error) {
    const e = data.error;
    if (e.type !== 'card_error') {
      return res.status(502).json({ error: 'Stripe refused the request: ' + (e.message || e.type || 'unknown error') });
    }
    return res.status(200).json({
      paid: false,
      code: e.code || null,
      decline_code: e.decline_code || null,
      message: e.message || null,
      id: (e.payment_intent && e.payment_intent.id) || null
    });
  }

  return res.status(200).json({
    paid: data.status === 'succeeded',
    code: data.status === 'succeeded' ? null : (data.status || null),
    decline_code: null,
    message: null,
    id: data.id || null
  });
};

module.exports.CARDS = CARDS;
