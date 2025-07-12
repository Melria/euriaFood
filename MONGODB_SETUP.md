# Guide MongoDB Atlas

## 1. Créer un cluster gratuit sur MongoDB Atlas
1. Aller sur https://cloud.mongodb.com/
2. Créer un compte gratuit
3. Créer un nouveau cluster (M0 Sandbox - Gratuit)
4. Choisir une région proche de vos utilisateurs

## 2. Configuration de sécurité
1. Database Access : Créer un utilisateur avec mot de passe
2. Network Access : Ajouter 0.0.0.0/0 (permet toutes les IPs)

## 3. Obtenir l'URL de connexion
Format : mongodb+srv://username:password@cluster.mongodb.net/database_name

## 4. Variables d'environnement à configurer
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/restaurant_db
DB_NAME=restaurant_db

## Alternative : MongoDB sur Railway
Railway propose aussi MongoDB avec une configuration automatique.
