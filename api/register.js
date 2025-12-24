// api/register.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const body = await req.json();
    const { name, email } = body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nom requis' });
    }

    // ✅ Utilise les variables d'environnement
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Vérifier unicité du nom
    const { data: existing, error: checkError } = await supabaseAdmin
      .from('restaurants')
      .select('id')
      .eq('name', name.trim())
      .single()
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = pas de résultat
      console.error('Erreur Supabase:', checkError);
      return res.status(500).json({ error: 'Erreur interne' });
    }

    if (existing) {
      return res.status(409).json({ error: 'Nom déjà utilisé' });
    }

    // Générer un ID public sécurisé
    const public_id = 'rest_' + Math.random().toString(36).substring(2, 10);

    // Insérer dans la base
    const { error: insertError } = await supabaseAdmin
      .from('restaurants')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        public_id
      });

    if (insertError) {
      console.error('Erreur insertion:', insertError);
      return res.status(500).json({ error: 'Erreur serveur' });
    }

    // ✅ Générer les liens
    const client_url = `${process.env.CLIENT_URL}/?token=${public_id}`;
    const staff_url = `${process.env.STAFF_URL}/staff.html?token=${public_id}`;

    res.status(201).json({
      restaurant_id: public_id,
      client_url,
      staff_url
    });

  } catch (err) {
    console.error('Erreur générale:', err);
    res.status(500).json({ error: 'Erreur inconnue' });
  }
}