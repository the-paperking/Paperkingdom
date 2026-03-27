const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

function generateCode(prefix = 'PK') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${part1}-${part2}`;
}

const PREFIXES = { yoshi: 'YSH' };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Admin auth
  const { adminKey, productId } = req.body;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (!productId || !PREFIXES[productId]) {
    return res.status(400).json({ error: 'Producto inválido' });
  }

  // Generate unique code
  let code;
  let exists = true;
  while (exists) {
    code = generateCode(PREFIXES[productId]);
    const { data } = await supabase.from('access_codes').select('code').eq('code', code);
    exists = data && data.length > 0;
  }

  const { error } = await supabase.from('access_codes').insert({
    code,
    product_id: productId,
    is_active: true,
  });

  if (error) return res.status(500).json({ error: 'Error al crear código' });

  return res.status(200).json({ success: true, code });
};
