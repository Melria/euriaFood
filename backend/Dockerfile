# Utiliser Python 3.11 officiel avec image slim pour plus de rapidité
FROM python:3.11-slim

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système nécessaires
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    pkg-config \
    libffi-dev \
    libssl-dev \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Vérifier que pip est bien installé et le mettre à jour
RUN python3 -m pip --version
RUN python3 -m pip install --upgrade pip setuptools wheel

# Copier d'abord requirements.txt pour utiliser le cache Docker
COPY requirements.txt .

# Installer les dépendances Python en utilisant python3 -m pip
RUN python3 -m pip install -r requirements.txt

# Copier le code source
COPY . .

# Créer un utilisateur non-root pour la sécurité
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Exposer le port
EXPOSE 8000

# Commande de démarrage avec auto-détection du port
CMD ["python3", "-m", "uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
