import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    const { user_id } = req.query;
    const { data, error } = await supabase.from('profiles').select('*').eq('id', user_id).single();
    if (error) return res.status(404).json({ error: error.message });
    return res.status(200).json(data);
  }
  res.status(405).end();
}
