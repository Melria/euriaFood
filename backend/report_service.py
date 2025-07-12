from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from datetime import datetime, timedelta
from typing import List, Dict
import io
import base64

class ReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            textColor=colors.HexColor('#f97316')
        )
    
    def generate_daily_report(self, orders: List[Dict], date: datetime) -> bytes:
        """Générer un rapport journalier PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre
        title = Paragraph(f"Rapport Journalier - {date.strftime('%d/%m/%Y')}", self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Statistiques générales
        total_orders = len(orders)
        total_revenue = sum(order.get('total', 0) for order in orders)
        avg_order = total_revenue / total_orders if total_orders > 0 else 0
        
        stats_data = [
            ['Statistiques', 'Valeur'],
            ['Nombre de commandes', str(total_orders)],
            ['Chiffre d\'affaires', f"{total_revenue:.2f} €"],
            ['Panier moyen', f"{avg_order:.2f} €"]
        ]
        
        stats_table = Table(stats_data)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 30))
        
        # Détail des commandes
        if orders:
            story.append(Paragraph("Détail des Commandes", self.styles['Heading2']))
            story.append(Spacer(1, 10))
            
            orders_data = [['Heure', 'Client', 'Statut', 'Total']]
            for order in orders:
                created_at = datetime.fromisoformat(order['created_at'].replace('Z', '+00:00'))
                orders_data.append([
                    created_at.strftime('%H:%M'),
                    order.get('user_name', 'Client'),
                    order.get('status', 'pending'),
                    f"{order.get('total', 0):.2f} €"
                ])
            
            orders_table = Table(orders_data)
            orders_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(orders_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    def generate_invoice(self, order: Dict, user: Dict) -> bytes:
        """Générer une facture PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # En-tête facture
        title = Paragraph(f"Facture #{order['id'][:8]}", self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Informations client
        client_info = f"""
        <b>Client:</b> {user.get('name', 'N/A')}<br/>
        <b>Email:</b> {user.get('email', 'N/A')}<br/>
        <b>Date:</b> {datetime.fromisoformat(order['created_at'].replace('Z', '+00:00')).strftime('%d/%m/%Y %H:%M')}
        """
        story.append(Paragraph(client_info, self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Détail des articles
        items_data = [['Article', 'Quantité', 'Prix unitaire', 'Total']]
        for item in order.get('items', []):
            items_data.append([
                item.get('name', 'Article'),
                str(item.get('quantity', 1)),
                f"{item.get('price', 0):.2f} €",
                f"{item.get('price', 0) * item.get('quantity', 1):.2f} €"
            ])
        
        # Total
        items_data.append(['', '', 'TOTAL', f"{order.get('total', 0):.2f} €"])
        
        items_table = Table(items_data)
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-2, -2), colors.beige),
            ('BACKGROUND', (-2, -1), (-1, -1), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (-2, -1), (-1, -1), colors.whitesmoke),
            ('FONTNAME', (-2, -1), (-1, -1), 'Helvetica-Bold'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(items_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def generate_period_report(self, orders: List[Dict], period: str, start_date: datetime, end_date: datetime) -> bytes:
        """Générer un rapport pour une période donnée"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        story = []
        
        # Titre selon la période
        period_labels = {
            'today': f"Rapport du jour - {start_date.strftime('%d/%m/%Y')}",
            'week': f"Rapport hebdomadaire - {start_date.strftime('%d/%m')} au {end_date.strftime('%d/%m/%Y')}",
            'month': f"Rapport mensuel - {start_date.strftime('%d/%m')} au {end_date.strftime('%d/%m/%Y')}"
        }
        
        title = Paragraph(period_labels.get(period, "Rapport de période"), self.title_style)
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Statistiques générales
        total_orders = len(orders)
        total_revenue = sum(order.get('total', 0) for order in orders)
        avg_order = total_revenue / total_orders if total_orders > 0 else 0
        
        stats_data = [
            ['Statistiques', 'Valeur'],
            ['Nombre de commandes', str(total_orders)],
            ['Chiffre d\'affaires', f"{total_revenue:.2f} €"],
            ['Panier moyen', f"{avg_order:.2f} €"]
        ]
        
        stats_table = Table(stats_data)
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(stats_table)
        story.append(Spacer(1, 20))
        
        # Analyse des plats populaires
        if orders:
            item_counts = {}
            for order in orders:
                items = order.get('items', [])
                for item in items:
                    name = item.get('name', 'Article inconnu')
                    quantity = item.get('quantity', 1)
                    item_counts[name] = item_counts.get(name, 0) + quantity
            
            if item_counts:
                story.append(Paragraph("Plats les plus commandés", self.styles['Heading2']))
                story.append(Spacer(1, 12))
                
                popular_items = sorted(item_counts.items(), key=lambda x: x[1], reverse=True)[:10]
                items_data = [['Plat', 'Quantité vendue']]
                
                for item_name, count in popular_items:
                    items_data.append([item_name, str(count)])
                
                items_table = Table(items_data)
                items_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(items_table)
                story.append(Spacer(1, 20))
        
        # Liste des commandes détaillées
        if orders:
            story.append(Paragraph("Détail des commandes", self.styles['Heading2']))
            story.append(Spacer(1, 12))
            
            orders_data = [['N° Commande', 'Date', 'Client', 'Montant', 'Statut']]
            
            for order in orders[:20]:  # Limiter à 20 commandes pour éviter des rapports trop longs
                order_date = order.get('created_at', 'N/A')
                if isinstance(order_date, str):
                    try:
                        order_date = datetime.fromisoformat(order_date.replace('Z', '+00:00'))
                        order_date = order_date.strftime('%d/%m %H:%M')
                    except:
                        order_date = 'N/A'
                
                orders_data.append([
                    order.get('id', 'N/A')[:8],
                    order_date,
                    order.get('user_id', 'N/A')[:8],
                    f"{order.get('total', 0):.2f} €",
                    order.get('status', 'N/A')
                ])
            
            orders_table = Table(orders_data)
            orders_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f97316')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(orders_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

# Instance globale
report_service = ReportService()