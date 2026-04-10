import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { user_id } = req.query;
    const { data, error } = await supabase.from('family').select('*').eq('user_id', user_id);
    if (error) return res.status(404).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST') {
    const family = req.body;
    const { data, error } = await supabase.from('family').insert([family]).select();
    if (error) return res.status(400).json({ error: error.message });
    return res.status(201).json(data);
  }
  res.status(405).end();
}
