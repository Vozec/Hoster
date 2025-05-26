<div align="center">

# 🚀 Payload Hoster

![Payload Hoster Logo](./github/logo.png)

*Une application rapide pour créer et gérer du contenu et des routes dynamiques avec un panneau d'administration et un API sécurisé*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-14.x-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-17.x-61DAFB?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.x-47A248?logo=mongodb)](https://www.mongodb.com/)

</div>

## ✨ Caractéristiques

- 🌐 **Routage dynamique** - Création de routes avec différents types de contenu (HTML, JSON, JS, PHP, texte, XML)
- 🔒 **Administration sécurisée** - Interface d'administration protégée par authentification
- 🌳 **Hiérarchie flexible** - Support pour les routes avec plusieurs niveaux de profondeur (/xxx, /xxx/yyy, /xx/yy/zz)
- 📊 **Tableau de bord** - Visualisation de toutes les routes et statistiques
- 📝 **Journalissécuriséation** - Logs d'accès pour chaque route
- 🔄 **Gestion complète** - Modification et suppression des routes
- ⚡ **Temps réel** - Logs en temps réel avec WebSocket
- 🔌 **API REST** - API complète pour l'intégration avec d'autres services
- 🐍 **CLI Python** - Interface en ligne de commande pour une gestion facile
- 🐘 **Support PHP** - Évaluation de code PHP pour des contenus dynamiques

## 💻 Installation

### Prérequis

- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/) (pour le clonage du dépôt)
- [Python 3.6+](https://www.python.org/) (pour l'utilisation du CLI)

### Étapes d'installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/vozec/payload-hoster.git
cd payload-hoster
```

2. **Configurer les variables d'environnement**

Créez un fichier `.env` à la racine du projet avec les paramètres suivants :

```env
# Configuration du serveur
PORT=3000

# Configuration de MongoDB
MONGODB_USER=admin
MONGODB_PASSWORD=password

# Configuration de l'administration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_PATH=/manager/

# Configuration de l'API
API_PATH=/api
API_KEY=payload_hoster_secret_api_key_2025
```

3. **Démarrer l'application**

```bash
docker-compose --env-file .env up --build
```

L'application sera accessible à l'adresse : [http://localhost:3000](http://localhost:3000)

## 💯 Utilisation

### 💻 Interface d'administration

![Admin Panel](./github/admin-panel.png)

Accédez à l'interface d'administration à l'adresse : [http://localhost:3000/manager/](http://localhost:3000/manager/)

Connectez-vous avec les identifiants définis dans le fichier `.env` :
- Nom d'utilisateur : `admin` (par défaut)
- Mot de passe : `admin123` (par défaut)

L'interface d'administration vous permet de :
- Créer, modifier et supprimer des routes
- Visualiser les statistiques d'accès
- Consulter les logs en temps réel
- Gérer les paramètres de l'application

![Logs](./github/logs.png)

### 🔗 API REST

Vous pouvez accéder à l'API de manière programmatique en utilisant la clé API définie dans le fichier `.env`. Incluez la clé API dans vos requêtes en utilisant l'en-tête `X-API-Key` :

```bash
curl -X GET http://localhost:3000/api/v1/routes \
  -H "X-API-Key: payload_hoster_secret_api_key_2025"
```

#### Points d'accès API disponibles

| Méthode | Point d'accès | Description |
|---------|--------------|-------------|
| GET | `/api/v1/routes` | Liste toutes les routes |
| GET | `/api/v1/routes/:id` | Récupère une route spécifique |
| POST | `/api/v1/routes` | Crée une nouvelle route |
| PUT | `/api/v1/routes/:id` | Met à jour une route |
| DELETE | `/api/v1/routes/:id` | Supprime une route |
| GET | `/api/v1/stats` | Récupère les statistiques système |
| GET | `/api/v1/logs` | Récupère les logs d'accès |

### 🐍 Interface en ligne de commande (CLI)

Payload Hoster est fourni avec un CLI Python pour faciliter le téléversement de fichiers et la gestion des routes.

```bash
$ hoster
usage: hoster [-h] {setup,up,ls,rm,edit,url,logs} ...

Payload Hoster Client

positional arguments:
  {setup,up,ls,rm,edit,url,logs}
                        Command to execute
    setup               Configure the client
    up                  Upload a file
    ls                  List all routes
    rm                  Delete a route
    edit                Edit a route
    url                 Get the full URL for a route
    logs                Watch access logs in real-time

options:
  -h, --help            show this help message and exit
```

#### Installation du CLI

```bash
pip install -r requirements.txt
chmod +x ./hoster
sudo ln -s ./hoster /usr/local/bin/hoster
```

#### Configuration

Configurez le CLI avec votre clé API et l'URL du serveur :

```bash
hoster setup --key "payload_hoster_secret_api_key_2025" --server "http://localhost:3000/api"
```

#### Téléversement de fichiers

**Téléverser un fichier** (crée une route temporaire avec un chemin aléatoire) :

```bash
hoster up example.html
# Sortie: http://localhost:3000/a1b2c3d4/example
```

**Téléverser un fichier permanent** (utilise également un chemin aléatoire) :

```bash
hoster up example.html --permanent
# Sortie: http://localhost:3000/e5f6g7h8/example
```

Chaque route reçoit un nom unique avec un suffixe numérique incrémental (par exemple, `example_1`, `example_2`) pour éviter les collisions de noms.

La différence entre les routes temporaires et permanentes réside dans leur catégorie de stockage, ce qui affecte la façon dont elles sont gérées par le serveur.

**Spécifier le type de contenu** :

```bash
# Utiliser un raccourci
hoster up data.txt --ct json

# Ou spécifier le type MIME complet
hoster up data.txt --content-type application/json

# Téléverser du code PHP
hoster up script.php --ct php
```

#### Gestion des routes

**Lister toutes les routes** :

```bash
hoster ls
```

**Supprimer une route par nom** :

```bash
hoster rm example_1
```

**Modifier les propriétés d'une route** :

```bash
# Modifier le contenu directement
hoster edit example_1 -c "Nouveau contenu"

# Modifier le contenu à partir d'un fichier
hoster edit example_1 -f nouveau_contenu.txt

# Changer le nom
hoster edit example_1 -n "nouveau_nom"

# Changer la catégorie
hoster edit example_1 --category temporary

# Changer le type de contenu
hoster edit example_1 --ct json
```

**Obtenir l'URL complète d'une route** :

```bash
hoster url example_1
```

Cette commande affiche uniquement l'URL complète de la route, ce qui facilite son utilisation dans des scripts ou pour copier/coller.

**Surveiller les logs d'accès en temps réel** :

```bash
hoster logs
```

Cette commande se connecte au serveur via WebSocket et affiche toutes les requêtes entrantes en temps réel. Appuyez sur Ctrl+C pour arrêter la surveillance.

### 📝 Création d'une route via l'interface web

![Create Route](./github/create-route.png)

1. Connectez-vous à l'interface d'administration
2. Cliquez sur "Nouvelle Route" dans le menu
3. Remplissez le formulaire :
   - **Chemin** : le chemin de la route (par exemple, /ma-route)
   - **Nom** : un nom descriptif pour la route
   - **Type de contenu** : HTML, JSON, PHP, texte ou XML
   - **Contenu** : le contenu qui sera servi lorsque la route sera accédée
4. Cliquez sur "Créer"

### 🌐 Accès aux routes dynamiques

Les routes créées sont directement accessibles à leur chemin :
- [http://localhost:3000/ma-route](http://localhost:3000/ma-route)
- [http://localhost:3000/api/produits](http://localhost:3000/api/produits)
- etc.

#### Support PHP

Les routes avec le type de contenu PHP sont évaluées par le serveur PHP intégré. Vous pouvez utiliser toutes les fonctionnalités PHP standard, y compris les fonctions comme `header()` pour les redirections ou la définition d'en-têtes personnalisés.

**Exemple de code PHP** :

```php
<?php
// Redirection vers une autre page
header('Location: /autre-page');
exit;
?>
```

```php
<?php
// Génération de JSON dynamique
header('Content-Type: application/json');
$data = [
    'success' => true,
    'message' => 'Bonjour depuis PHP!',
    'timestamp' => time()
];
echo json_encode($data);
?>
```

## 🛠️ Architecture du projet

```
│── admin-frontend/          # Frontend React pour l'administration
│   │── public/              # Ressources statiques
│   │── src/                 # Code source React
│   └── package.json         # Dépendances npm pour le frontend
│
│── src/
│   │── controllers/         # Contrôleurs Express
│   │── middlewares/         # Middlewares (auth, logger, etc.)
│   │── models/              # Modèles Mongoose
│   │── routes/              # Routes Express
│   │── services/            # Services (WebSocket, etc.)
│   │── utils/               # Utilitaires (PHP evaluator, etc.)
│   └── app.js               # Point d'entrée de l'application
│
│── hoster                # CLI Python
│── .env                     # Variables d'environnement
│── docker-compose.yml       # Configuration Docker
│── Dockerfile.backend       # Dockerfile pour le backend
│── package.json             # Dépendances npm pour le backend
└── README.md                # Documentation
```

## 🔒 Sécurité

- **Authentification JWT** - L'interface d'administration est protégée par des tokens JWT
- **Hachage des mots de passe** - Les mots de passe sont hachés avec bcrypt
- **Routes protégées** - Les routes d'administration nécessitent une authentification
- **Validation des requêtes** - Toutes les requêtes API sont validées
- **API Key** - Les points d'accès API peuvent être accédés avec une clé API pour un accès programmatique
- **CORS configurable** - En-têtes CORS pour les routes dynamiques

## 👨‍💻 Développement

Pour le développement, vous pouvez exécuter séparément :

```bash
# Backend
npm run dev

# Frontend
cd admin-frontend
npm start
```

## 📖 Licence

[MIT](LICENSE)

---

<div align="center">

👍 ~~Développé~~ Vibecodé par [Vozec](https://github.com/vozec) 👍

</div>
