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

# Instance globale
report_service = ReportService()