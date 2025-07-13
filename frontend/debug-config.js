// Test rapide pour diagnostiquer le problème IA
// Copiez ce code dans la console du navigateur sur votre site Vercel

console.log('🔍 Diagnostic IA en cours...');

// Test des insights avec analyse détaillée
fetch('https://emergent-app-2i83.onrender.com/api/ai/insights', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('📊 Status:', r.status);
  return r.json();
})
.then(data => {
  console.log('📊 Réponse complète:', data);
  
  if (data.insights) {
    const insights = data.insights;
    console.log('✅ Insights trouvés:', insights);
    
    // Analyser le type de données
    if (insights.insights && insights.insights.length > 0) {
      const firstInsight = insights.insights[0];
      console.log('🔍 Premier insight:', firstInsight);
      
      if (typeof firstInsight === 'string') {
        if (firstInsight.includes('Aucune commande trouvée')) {
          console.log('❌ PROBLÈME: Base de données vide');
          console.log('💡 SOLUTION: Ajouter des commandes de test');
        } else if (firstInsight.includes('Service IA temporairement indisponible')) {
          console.log('❌ PROBLÈME: API OpenAI en erreur');
          console.log('💡 SOLUTION: Vérifier clé OpenAI sur Render');
        } else if (firstInsight.includes('Restaurant en phase de démarrage')) {
          console.log('ℹ️ INFO: Données de démonstration affichées');
        }
      } else {
        console.log('✅ IA fonctionne - données structurées reçues');
      }
    }
    
    if (insights.recommendations) {
      console.log('📋 Recommandations:', insights.recommendations);
    }
  } else {
    console.log('❌ Pas d\'insights dans la réponse');
  }
})
.catch(e => {
  console.log('❌ Erreur:', e);
  console.log('💡 Vérifiez que vous êtes connecté en tant qu\'admin');
});
