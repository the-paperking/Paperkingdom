const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

module.exports = async (req, res) => {
  const origin = req.headers.origin;
  const allowed = ['https://the-paperking.github.io', 'http://localhost:3000'];
  if(allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  else res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, deviceId } = req.body;
  if (!code || !deviceId) return res.status(400).json({ error: 'Missing code or deviceId' });

  const cleanCode = code.trim().toUpperCase();

  // Get code from DB
  const { data, error } = await supabase
    .from('access_codes')
    .select('*')
    .eq('code', cleanCode)
    .single();

  if (error || !data) return res.status(404).json({ error: 'Código no encontrado' });
  if (!data.is_active) return res.status(403).json({ error: 'Código desactivado' });

  // Check if device already registered
  if (data.device_1 === deviceId || data.device_2 === deviceId) {
    return res.status(200).json({ success: true, product_id: data.product_id });
  }

  // Register device
  if (!data.device_1) {
    await supabase.from('access_codes').update({
      device_1: deviceId,
      activated_at: new Date().toISOString(),
    }).eq('code', cleanCode);
    return res.status(200).json({ success: true, product_id: data.product_id });
  }

  if (!data.device_2) {
    await supabase.from('access_codes').update({
      device_2: deviceId,
    }).eq('code', cleanCode);
    return res.status(200).json({ success: true, product_id: data.product_id });
  }

  // Both slots taken
  return res.status(403).json({ 
    error: 'Este código ya está activo en 2 dispositivos. Contacta a @the_paperking para ayuda.' 
  });
};
