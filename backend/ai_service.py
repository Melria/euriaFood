import openai
import os
import json
import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import logging
from config import validate_environment, get_openai_api_key

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        # Validate environment and get API key
        try:
            validate_environment()
            api_key = get_openai_api_key()
        except ValueError as e:
            logger.error(f"Environment configuration error: {e}")
            raise
        
        # Initialize OpenAI client
        self.client = openai.OpenAI(api_key=api_key)
        logger.info("AI Service initialized successfully with OpenAI API")
    
    async def generate_menu_recommendations(self, user_id: str, order_history: List, preferences: Optional[Dict] = None):
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
            
            Répondez UNIQUEMENT en JSON valide avec la structure suivante:
            {{
                "recommended_items": [
                    {{
                        "name": "nom du plat",
                        "reason": "raison de la recommandation",
                        "confidence_score": 0.XX
                    }}
                ],
                "insights": "analyse du comportement client"
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert en recommandations culinaires. Répondez uniquement en JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            if response_text:
                response_text = response_text.strip()
            else:
                logger.error("Empty response from OpenAI")
                return {"error": "Empty response from AI"}
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response: {response_text}")
                return {"error": "Invalid response format from AI"}
            
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
            
            Répondez UNIQUEMENT en JSON valide avec la structure suivante:
            {{
                "predictions": [
                    {{
                        "item_name": "nom de l'article",
                        "predicted_demand": nombre_entier,
                        "confidence": 0.XX,
                        "trend": "stable/croissant/décroissant"
                    }}
                ],
                "alerts": ["alerte 1", "alerte 2"]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert en prédiction de demande. Répondez uniquement en JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            if response_text:
                response_text = response_text.strip()
            else:
                logger.error("Empty response from OpenAI")
                return {"error": "Empty response from AI"}
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response: {response_text}")
                return {"error": "Invalid response format from AI"}
            
        except Exception as e:
            logger.error(f"Erreur prédiction inventaire: {e}")
            return {"error": str(e)}
    
    async def optimize_pricing(self, menu_items: List, market_data: Optional[Dict] = None):
        """Optimisation intelligente des prix"""
        try:
            prompt = f"""
            Optimisez les prix des articles de menu basé sur les données suivantes:
            
            Articles actuels: {json.dumps(menu_items, default=str)}
            Données marché: {json.dumps(market_data or {}, default=str)}
            
            Optimisez pour:
            - Maximisation profit
            - Compétitivité
            - Attractivité client
            - Elasticité de la demande
            
            Répondez UNIQUEMENT en JSON valide avec la structure suivante:
            {{
                "optimized_prices": [
                    {{
                        "item_name": "nom de l'article",
                        "current_price": prix_actuel,
                        "optimized_price": nouveau_prix,
                        "change": "pourcentage_changement",
                        "reasoning": "raison du changement"
                    }}
                ],
                "reasoning": "explication générale de l'optimisation",
                "expected_impact": "impact attendu sur les ventes et profits"
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert en stratégie de pricing. Répondez uniquement en JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            if response_text:
                response_text = response_text.strip()
            else:
                logger.error("Empty response from OpenAI")
                return {"error": "Empty response from AI"}
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response: {response_text}")
                return {"error": "Invalid response format from AI"}
            
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
            
            Répondez UNIQUEMENT en JSON valide avec la structure suivante:
            {{
                "insights": [
                    {{
                        "category": "catégorie",
                        "description": "description de l'insight",
                        "impact": "high/medium/low"
                    }}
                ],
                "recommendations": ["recommandation 1", "recommandation 2"],
                "priority_actions": ["action prioritaire 1", "action prioritaire 2"]
            }}
            """
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Vous êtes un expert en analyse business. Répondez uniquement en JSON valide."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=1000
            )
            
            response_text = response.choices[0].message.content
            if response_text:
                response_text = response_text.strip()
            else:
                logger.error("Empty response from OpenAI")
                return {"error": "Empty response from AI"}
            
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response: {response_text}")
                return {"error": "Invalid response format from AI"}
            
        except Exception as e:
            logger.error(f"Erreur insights business: {e}")
            return {"error": str(e)}

# Instance globale du service IA
ai_service = AIService()