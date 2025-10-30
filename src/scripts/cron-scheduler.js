#!/usr/bin/env node

import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const TZ = 'America/Toronto';
const fmt = (d = new Date()) =>
  new Intl.DateTimeFormat('fr-CA', { dateStyle: 'short', timeStyle: 'long', timeZone: TZ }).format(d);

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;
const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '*/1 * * * *';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('LUDOV - Envoi automatique de rappels');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`Fréquence : ${CRON_SCHEDULE}`);
console.log(`URL de l'API : ${APP_URL}/api/reservation/send-reminders`);
console.log(`Secret configuré : ${CRON_SECRET ? 'Oui ✓' : 'Non ✗'}`);
console.log(`Démarré le : ${fmt()}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (!CRON_SECRET) {
  console.error('ERREUR : CRON_SECRET n\'est pas configuré !');
  console.error('   Ajoutez CRON_SECRET dans votre fichier .env\n');
  process.exit(1);
}

async function envoyerRappels() {
  const maintenant = fmt();
  console.log(`\n [${maintenant}] Vérification des rappels à envoyer...`);

  try {
    const response = await fetch(`${APP_URL}/api/reservation/send-reminders`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'User-Agent': 'LUDOV-Cron/1.0',
      },
    });

    const data = await response.json();
    const fin = fmt();

    if (response.ok) {
      console.log(` [${fin}] Terminé avec succès !`);
      console.log(`    Emails envoyés : ${data.sent}`);
      console.log(`    Erreurs : ${data.errors}`);
      console.log(`     Temps d'exécution : ${data.duration}ms`);

      if (data.errorDetails && data.errorDetails.length > 0) {
        console.warn('\n  Certains emails n\'ont pas pu être envoyés :');
        data.errorDetails.forEach(err => {
          console.warn(`   - Réservation ${err.id}: ${err.error}`);
        });
      }
    } else {
      console.error(` [${fin}] Erreur HTTP ${response.status}`);
      console.error('Réponse:', data);
    }
  } catch (error) {
    const erreur = new Date().toLocaleString('fr-CA');
    console.error(` [${erreur}] La requête a échoué :`, error.message);
  }
}

(async () => {
  console.log('Test de connexion à l\'API...\n');
  
  try {
    await envoyerRappels();
    console.log('\n Test réussi ! Le cron va maintenant s\'exécuter automatiquement.\n');
  } catch (error) {
    console.error('\n Test échoué !');
    console.error('Erreur:', error.message);
    console.error('\nVérifiez que :');
    console.error('  1. Votre application Next.js est lancée');
    console.error('  2. L\'URL dans NEXT_PUBLIC_APP_URL est correcte');
    console.error('  3. Le CRON_SECRET correspond à celui de votre API\n');
    process.exit(1);
  }

  console.log(` Démarrage du planificateur avec : ${CRON_SCHEDULE}\n`);

  if (!cron.validate(CRON_SCHEDULE)) {
    console.error(` Format invalide pour CRON_SCHEDULE : ${CRON_SCHEDULE}`);
    process.exit(1);
  }

  cron.schedule(
    CRON_SCHEDULE,
    async () => {
      try {
        await envoyerRappels();
      } catch (error) {
        console.error(' Erreur lors de l\'exécution :', error?.message || error);
      }
    },
    { timezone: TZ }
  );

  console.log(` Démarrage du planificateur avec : ${CRON_SCHEDULE} (TZ=${TZ})\n`);
  console.log(' Le planificateur est actif !');
  console.log(' En attente de la prochaine exécution...\n');
  console.log(' Pour arrêter : Ctrl+C\n');
})();