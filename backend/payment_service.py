import stripe
import os
from typing import Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_emergent')
        self.webhook_secret = os.environ.get('STRIPE_WEBHOOK_SECRET', '')
    
    async def create_payment_intent(self, amount: float, currency: str = "eur", metadata: Dict = None):
        """Créer un PaymentIntent Stripe"""
        try:
            intent = stripe.PaymentIntent.create(
                amount=int(amount * 100),  # Stripe utilise les centimes
                currency=currency,
                metadata=metadata or {},
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "status": intent.status
            }
        except stripe.error.StripeError as e:
            logger.error(f"Erreur Stripe: {e}")
            raise Exception(f"Erreur de paiement: {str(e)}")
    
    async def confirm_payment(self, payment_intent_id: str):
        """Confirmer un paiement"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            return {
                "status": intent.status,
                "amount": intent.amount / 100,
                "currency": intent.currency
            }
        except stripe.error.StripeError as e:
            logger.error(f"Erreur confirmation paiement: {e}")
            raise Exception(f"Erreur confirmation: {str(e)}")
    
    async def create_refund(self, payment_intent_id: str, amount: Optional[float] = None):
        """Créer un remboursement"""
        try:
            refund_data = {"payment_intent": payment_intent_id}
            if amount:
                refund_data["amount"] = int(amount * 100)
            
            refund = stripe.Refund.create(**refund_data)
            return {
                "refund_id": refund.id,
                "status": refund.status,
                "amount": refund.amount / 100
            }
        except stripe.error.StripeError as e:
            logger.error(f"Erreur remboursement: {e}")
            raise Exception(f"Erreur remboursement: {str(e)}")

# Instance globale
payment_service = PaymentService()