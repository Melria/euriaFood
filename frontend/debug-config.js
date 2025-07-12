// Test rapide pour vérifier la configuration
// Copiez ce code dans la console du navigateur sur votre site Vercel

console.log('🔍 Configuration actuelle:');
console.log('REACT_APP_BACKEND_URL:', process.env.REACT_APP_BACKEND_URL);
console.log('API_BASE_URL utilisé:', window.location.origin);

// Test de connexion
fetch('https://emergent-app-2i83.onrender.com/docs')
  .then(r => console.log('✅ Backend accessible:', r.status))
  .catch(e => console.log('❌ Backend inaccessible:', e));
