// api/register.ts
import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { name, email } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nom requis' });
  }

  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: existing } = await supabaseAdmin
    .from('restaurants')
    .select('id')
    .eq('name', name.trim())
    .single()
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Nom déjà utilisé' });
  }

  const public_id = 'rest_' + Math.random().toString(36).substring(2, 10);

  const { error } = await supabaseAdmin
    .from('restaurants')
    .insert({
      name: name.trim(),
      email: email?.trim() || null,
      public_id
    });

  if (error) {
    console.error('Erreur Supabase:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }

  const client_url = `${process.env.CLIENT_URL}/?token=${public_id}`;
  const staff_url = `${process.env.STAFF_URL}/staff.html?token=${public_id}`;

  res.status(201).json({
    restaurant_id: public_id,
    client_url,
    staff_url
  });
}