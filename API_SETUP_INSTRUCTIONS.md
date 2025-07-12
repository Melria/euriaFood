# Configuration de l'API OpenAI

## Étapes pour configurer votre clé API OpenAI

### 1. Obtenir votre clé API OpenAI
1. Allez sur [platform.openai.com](https://platform.openai.com)
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys" dans votre tableau de bord
4. Cliquez sur "Create new secret key"
5. Copiez votre clé API (elle commence par `sk-`)

### 2. Configurer la clé dans votre application
1. Ouvrez le fichier `backend/.env`
2. Remplacez `sk-proj-YOUR_ACTUAL_OPENAI_API_KEY_HERE` par votre vraie clé API
3. Sauvegardez le fichier

### 3. Redémarrer l'application
Après avoir configuré la clé API, redémarrez votre serveur backend pour que les changements prennent effet.

## Fonctionnalités IA maintenant disponibles

### Pour les clients :
- **Recommandations personnalisées** : Section IA dans le menu qui suggère des plats basés sur vos préférences
- **Suggestions intelligentes** : Recommandations basées sur l'historique des commandes

### Pour les administrateurs :
- **Insights IA** : Analyse intelligente des performances du restaurant
- **Optimisation des prix** : Suggestions de prix basées sur l'IA
- **Rapports avancés** : Rapports séparés du tableau de bord
- **Boutons fonctionnels** : Tous les boutons du dashboard admin sont maintenant opérationnels

## Résolution des problèmes

### Erreur 401 Unauthorized
- Vérifiez que votre clé API est correcte
- Assurez-vous qu'elle est bien configurée dans le fichier `.env`
- Redémarrez le serveur backend

### Pas de recommandations IA
- Vérifiez que la clé API est configurée
- Connectez-vous en tant qu'utilisateur pour voir les recommandations
- Vérifiez la console du navigateur pour les erreurs

## Architecture technique mise à jour

- ✅ **Schéma de couleurs harmonisé** : Couleur principale orange avec dégradés modernes
- ✅ **Interface client améliorée** : Section recommandations IA dans le menu avec design orange
- ✅ **Admin dashboard amélioré** : Boutons fonctionnels et fonctionnalités IA avec thème orange
- ✅ **Séparation des rapports** : Page de rapports distincte du tableau de bord
- ✅ **Design moderne** : Interface utilisateur cohérente et élégante avec palette orange
