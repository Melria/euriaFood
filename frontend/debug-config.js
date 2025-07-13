// Test rapide pour vérifier la configuration
// Copiez ce code dans la console du navigateur sur votre site Vercel

console.log('🔍 Configuration actuelle:');
console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
console.log('API_BASE_URL utilisé:', window.location.origin);

// Test de connexion backend
fetch('https://emergent-app-2i83.onrender.com/docs')
  .then(r => console.log('✅ Backend accessible:', r.status))
  .catch(e => console.log('❌ Backend inaccessible:', e));

// Test spécifique des insights IA avec la bonne route
fetch('https://emergent-app-2i83.onrender.com/api/ai/insights', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(r => {
  console.log('📊 API Insights status:', r.status);
  if (r.status === 401) {
    console.log('❌ Token manquant ou invalide');
    console.log('Token actuel:', localStorage.getItem('token'));
  }
  return r.json();
})
.then(data => {
  console.log('📊 Insights data complète:', data);
  if (data.insights) {
    console.log('✅ Insights trouvés:', data.insights.length, 'éléments');
    console.log('Structure insights:', Object.keys(data.insights));
  } else {
    console.log('❌ Pas d\'insights dans la réponse');
  }
})
.catch(e => console.log('❌ Erreur insights:', e));
