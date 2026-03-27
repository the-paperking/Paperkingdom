const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { deviceId, productId } = req.body;
  if (!deviceId || !productId) return res.status(400).json({ error: 'Missing params' });

  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('product_id', productId)
    .eq('is_active', true)
    .or(`device_1.eq.${deviceId},device_2.eq.${deviceId}`)
    .single();

  if (error || !data) {
    return res.status(403).json({ authorized: false });
  }

  return res.status(200).json({ authorized: true, product_id: data.product_id });
};
