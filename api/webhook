const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// Generate a unique code like YSH-4K2M-9X
function generateCode(prefix = 'PK') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${part1}-${part2}`;
}

// Map price ID to product info
function getProductInfo(priceId) {
  const products = {
    [process.env.STRIPE_PRICE_YOSHI]: { name: 'Yoshi', prefix: 'YSH', id: 'yoshi' },
  };
  return products[priceId] || { name: 'Paperkingdom', prefix: 'PK', id: 'unknown' };
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;
    const priceId = session.metadata?.priceId;
    const product = getProductInfo(priceId);

    // Generate unique code
    let code;
    let exists = true;
    while (exists) {
      code = generateCode(product.prefix);
      const { data } = await supabase.from('access_codes').select('code').eq('code', code);
      exists = data && data.length > 0;
    }

    // Save code to Supabase
    const { error } = await supabase.from('access_codes').insert({
      code,
      product_id: product.id,
      is_active: true,
    });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Could not save code' });
    }

    // Send email with code
    if (customerEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      await transporter.sendMail({
        from: `Paperkingdom <${process.env.EMAIL_FROM}>`,
        to: customerEmail,
        subject: `🎉 Tu código de acceso — ${product.name} Papercraft`,
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:32px;">
            <h1 style="color:#3a7d44;font-size:24px;">¡Gracias por tu compra!</h1>
            <p>Ya puedes armar tu <strong>${product.name}</strong> con el visor 3D de Paperkingdom.</p>
            
            <div style="background:#f5f0e8;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
              <p style="margin:0;color:#888;font-size:12px;letter-spacing:1px;">TU CÓDIGO DE ACCESO</p>
              <p style="margin:8px 0 0;font-size:32px;font-weight:bold;letter-spacing:4px;color:#1a1a1a;">${code}</p>
            </div>

            <p>Ve a <a href="${process.env.SITE_URL}/activar" style="color:#3a7d44;">${process.env.SITE_URL}/activar</a> e ingresa tu código para acceder al ensamblaje paso a paso.</p>
            
            <p style="font-size:13px;color:#888;">El código funciona en hasta <strong>2 dispositivos</strong> (ej. celular + computadora). Guárdalo bien — si lo compartes, la otra persona no podrá activarlo.</p>

            <hr style="border:none;border-top:1px solid #e5e0d8;margin:24px 0;">
            <p style="font-size:12px;color:#aaa;">Paperkingdom · @the_paperking</p>
          </div>
        `,
      });
    }
  }

  res.status(200).json({ received: true });
};
