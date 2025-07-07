import openai
import os
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # La clé sera ajoutée plus tard dans .env
        openai.api_key = os.environ.get('OPENAI_API_KEY', 'your-openai-key-here')
    
    async def generate_menu_recommendations(self, user_id: str, order_history: List, preferences: Dict = None):
        """Génère des recommandations de menu personnalisées"""
        try:
            prompt = f"""
            En tant qu'IA spécialisée en recommandations culinaires, analysez l'historique de commandes et générez des recommandations personnalisées.
            
            Historique client: {json.dumps(order_history, default=str)}
            Préférences: {json.dumps(preferences or {}, default=str)}
            
            Analysez:
            - Préférences alimentaires passées
            - Catégories favorites
            - Gamme de prix
            - Fréquence de commande
            
            Répondez en JSON avec: recommended_items (array avec name, reason, confidence_score), insights
            """
            
            # Simulation de réponse IA (remplacer par vraie API OpenAI)
            mock_response = {
                "recommended_items": [
                    {
                        "name": "Burger Signature",
                        "reason": "Basé sur vos commandes précédentes de burgers",
                        "confidence_score": 0.92
                    },
                    {
                        "name": "Salade Méditerranéenne", 
                        "reason": "Équilibre avec vos préférences santé",
                        "confidence_score": 0.87
                    }
                ],
                "insights": "Vous préférez les plats équilibrés avec une forte préférence pour les saveurs méditerranéennes."
            }
            
            return mock_response
            
        except Exception as e:
            logger.error(f"Erreur recommandations: {e}")
            return {"error": str(e)}
    
    async def predict_inventory_demand(self, historical_data: List, days_ahead: int = 7):
        """Prédiction intelligente de la demande d'inventaire"""
        try:
            prompt = f"""
            Analysez les données historiques de ventes et prédisez la demande pour les {days_ahead} prochains jours.
            
            Données historiques: {json.dumps(historical_data[:50], default=str)}
            
            Considérez:
            - Tendances saisonnières
            - Patterns jour de la semaine
            - Croissance/déclin des articles
            - Événements spéciaux
            
            Répondez en JSON avec: predictions (array avec item_name, predicted_demand, confidence), alerts
            """
            
            # Simulation de prédiction IA
            mock_prediction = {
                "predictions": [
                    {
                        "item_name": "Burger Classic",
                        "predicted_demand": 45,
                        "confidence": 0.89,
                        "trend": "stable"
                    },
                    {
                        "item_name": "Salade César",
                        "predicted_demand": 32,
                        "confidence": 0.75,
                        "trend": "croissant"
                    }
                ],
                "alerts": [
                    "Stock faible prévu pour Burger Classic - commander 50 unités",
                    "Demande croissante pour salades - augmenter stock de 25%"
                ]
            }
            
            return mock_prediction
            
        except Exception as e:
            logger.error(f"Erreur prédiction inventaire: {e}")
            return {"error": str(e)}
    
    async def optimize_pricing(self, menu_items: List, market_data: Dict = None):
        """Optimisation intelligente des prix"""
        try:
            prompt = f"""
            Optimisez les prix des articles de menu basé sur:
            
            Articles actuels: {json.dumps(menu_items, default=str)}
            Données marché: {json.dumps(market_data or {}, default=str)}
            
            Optimisez pour:
            - Maximisation profit
            - Compétitivité
            - Attractivité client
            - Elasticité de la demande
            
            Répondez en JSON avec: optimized_prices (array), reasoning, expected_impact
            """
            
            # Simulation d'optimisation prix
            mock_optimization = {
                "optimized_prices": [
                    {
                        "item_name": "Burger Classic",
                        "current_price": 12.90,
                        "optimized_price": 13.50,
                        "change": "+4.7%",
                        "reasoning": "Demande élevée permet augmentation modérée"
                    }
                ],
                "reasoning": "Optimisation basée sur l'analyse de la demande et de la concurrence",
                "expected_impact": "Augmentation estimée du profit de 8% avec impact minimal sur les ventes"
            }
            
            return mock_optimization
            
        except Exception as e:
            logger.error(f"Erreur optimisation prix: {e}")
            return {"error": str(e)}
    
    async def generate_business_insights(self, analytics_data: Dict):
        """Génère des insights business intelligents"""
        try:
            prompt = f"""
            Analysez les données business et fournissez des insights actionnables:
            
            Données: {json.dumps(analytics_data, default=str)}
            
            Fournissez des insights sur:
            - Performance des ventes
            - Comportement client
            - Opportunités d'optimisation
            - Tendances émergentes
            - Recommandations stratégiques
            
            Répondez en JSON avec: insights (array), recommendations (array), priority_actions
            """
            
            # Simulation d'insights business
            mock_insights = {
                "insights": [
                    {
                        "category": "Ventes",
                        "description": "Les ventes de burgers représentent 40% du CA avec une marge de 65%",
                        "impact": "high"
                    },
                    {
                        "category": "Clientèle", 
                        "description": "Les clients reviennent en moyenne tous les 12 jours",
                        "impact": "medium"
                    }
                ],
                "recommendations": [
                    "Développer une offre de fidélité pour augmenter la fréquence",
                    "Introduire des variantes de burgers premium",
                    "Optimiser les heures d'ouverture selon les pics de commande"
                ],
                "priority_actions": [
                    "Implémenter un programme de fidélité - Priorité haute",
                    "Analyser la rentabilité par plat - Priorité moyenne"
                ]
            }
            
            return mock_insights
            
        except Exception as e:
            logger.error(f"Erreur insights business: {e}")
            return {"error": str(e)}

# Instance globale du service IA
ai_service = AIService()