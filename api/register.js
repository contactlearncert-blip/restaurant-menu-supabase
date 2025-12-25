// api/register.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  let body;
  try {
    const buffer = await req.arrayBuffer();
    const text = new TextDecoder().decode(buffer);
    body = JSON.parse(text);
  } catch (err) {
    return res.status(400).json({ error: 'Body invalide' });
  }

  const { name, email } = body;
  if (!name?.trim()) {
    return res.status(400).json({ error: 'Nom requis' });
  }

  const supabaseAdmin = createClient(
    'https://anadvqaizeineseakpjq.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuYWR2cWFpemVpbmVzZWFrcGpxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjU5NDM0OCwiZXhwIjoyMDgyMTcwMzQ4fQ.gCREitKods5kzWUoXEDMLjvtIUw2tArkDYMj0jqeF-c'
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

  const client_url = `https://restaurant-menu-supabase.vercel.app/?token=${public_id}`;
  const staff_url = `https://restaurant-menu-supabase.vercel.app/staff.html?token=${public_id}`;

  res.status(201).json({
    restaurant_id: public_id,
    client_url,
    staff_url
  });
}