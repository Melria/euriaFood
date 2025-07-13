#!/usr/bin/env python3
# Test rapide pour diagnostiquer le problème IA

import requests
import json

# Test de l'API avec authentification
def test_ai_insights():
    print("🔍 Test des insights IA...")
    
    # Remplacez par votre token d'admin
    token = input("Entrez votre token d'admin: ")
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            "https://emergent-app-2i83.onrender.com/api/ai/insights",
            headers=headers,
            timeout=30
        )
        
        print(f"📊 Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Réponse reçue:")
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Analyser le type de réponse
            insights = data.get("insights", {})
            if isinstance(insights, dict):
                if "insights" in insights and isinstance(insights["insights"], list):
                    first_insight = insights["insights"][0] if insights["insights"] else ""
                    if "Aucune commande trouvée" in first_insight:
                        print("❌ Problème: Pas de commandes dans la base")
                    elif "Service IA temporairement indisponible" in first_insight:
                        print("❌ Problème: API OpenAI en erreur")
                    else:
                        print("✅ IA fonctionne correctement!")
        else:
            print(f"❌ Erreur: {response.text}")
            
    except Exception as e:
        print(f"❌ Erreur de connexion: {e}")

if __name__ == "__main__":
    test_ai_insights()
