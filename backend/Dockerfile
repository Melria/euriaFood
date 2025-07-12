# Utiliser Python 3.11 officiel avec image slim pour plus de rapidité
FROM python:3.11-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    pkg-config \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Mettre à jour pip
RUN pip install --upgrade pip

# Copier d'abord requirements.txt pour utiliser le cache Docker
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Exposer le port
EXPOSE 8000

# Commande de démarrage avec auto-détection du port
CMD uvicorn server:app --host 0.0.0.0 --port ${PORT:-8000}
