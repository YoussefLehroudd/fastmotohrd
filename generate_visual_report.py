from fpdf import FPDF
import os

class PDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=15)
        
    def header(self):
        self.set_font('Arial', 'B', 20)
        self.cell(0, 20, 'Rapport Visuel - FastMoto', 0, 1, 'C')
        self.ln(10)
        
    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Arial', 'B', 16)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)

    def chapter_body(self, text):
        self.set_font('Arial', '', 11)
        self.multi_cell(0, 7, text)
        self.ln()

    def add_screenshot(self, image_path, caption):
        if os.path.exists(image_path):
            # Add image
            self.image(image_path, x=10, y=None, w=190)
            # Add caption
            self.set_font('Arial', 'I', 10)
            self.ln(5)
            self.cell(0, 10, caption, 0, 1, 'C')
            self.ln(10)

# Create PDF instance
pdf = PDF()

# Add first page
pdf.add_page()

# Introduction
pdf.chapter_title("Introduction")
pdf.chapter_body("""
FastMoto est une plateforme moderne de location de motos entre particuliers. 
Cette application web offre une interface intuitive et sécurisée pour faciliter 
la mise en relation entre propriétaires et locataires de motos.
""")

# Login Page
pdf.chapter_title("Page de Connexion")
pdf.chapter_body("""
La page de connexion offre plusieurs options d'authentification :
- Connexion classique avec email et mot de passe
- Connexion avec Google
- Inscription pour les nouveaux utilisateurs
- Récupération de mot de passe
""")
pdf.add_screenshot('screenshots/login.png', 'Interface de connexion')

# Home Page
pdf.add_page()
pdf.chapter_title("Page d'Accueil")
pdf.chapter_body("""
La page d'accueil présente les motos disponibles avec :
- Filtres de recherche avancés
- Carte interactive des emplacements
- Liste des motos avec photos et détails
- Options de tri et filtrage
""")
pdf.add_screenshot('screenshots/home.png', "Page d'accueil avec liste des motos")

# Motor Details
pdf.add_page()
pdf.chapter_title("Détails d'une Moto")
pdf.chapter_body("""
La page de détails d'une moto affiche :
- Photos en haute résolution
- Description détaillée
- Disponibilités et tarifs
- Avis des utilisateurs
- Formulaire de réservation
""")
pdf.add_screenshot('screenshots/motor_details.png', 'Page de détails moto')

# Booking Process
pdf.add_page()
pdf.chapter_title("Processus de Réservation")
pdf.chapter_body("""
Le processus de réservation comprend :
- Sélection des dates
- Vérification de disponibilité
- Calcul du prix total
- Options de paiement
- Confirmation de réservation
""")
pdf.add_screenshot('screenshots/booking.png', 'Interface de réservation')

# User Dashboard
pdf.add_page()
pdf.chapter_title("Tableau de Bord Utilisateur")
pdf.chapter_body("""
Le tableau de bord permet aux utilisateurs de :
- Gérer leurs réservations
- Voir l'historique des locations
- Gérer leur profil
- Accéder aux messages
- Voir leurs notifications
""")
pdf.add_screenshot('screenshots/dashboard.png', 'Tableau de bord utilisateur')

# Chat System
pdf.add_page()
pdf.chapter_title("Système de Chat")
pdf.chapter_body("""
Le système de chat en temps réel permet :
- Communication directe entre utilisateurs
- Notifications instantanées
- Historique des conversations
- Indicateurs de lecture
""")
pdf.add_screenshot('screenshots/chat.png', 'Interface de chat')

# Admin Panel
pdf.add_page()
pdf.chapter_title("Panel Administrateur")
pdf.chapter_body("""
L'interface d'administration permet de :
- Gérer les utilisateurs
- Modérer les annonces
- Suivre les réservations
- Analyser les statistiques
- Gérer les paiements
""")
pdf.add_screenshot('screenshots/admin.png', "Panel d'administration")

# Save the PDF
try:
    pdf.output("Rapport_Visuel_FastMoto.pdf")
    print("Rapport visuel généré avec succès!")
except Exception as e:
    print(f"Erreur lors de la génération du rapport: {str(e)}")
