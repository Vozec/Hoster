<div align="center">

# Payload Hoster

*Créez et servez des routes dynamiques avec un panneau d'administration, une API REST et un CLI*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-47A248?logo=mongodb)](https://www.mongodb.com/)

</div>

---

## Fonctionnalités

- **Routage dynamique** — servez n'importe quel type de contenu (HTML, JSON, JS, PHP, XML, fichiers binaires)
- **Route racine par défaut** — `/` retourne `It Works` dès l'installation, modifiable à tout moment
- **Mode fichier** — uploadez des fichiers binaires servis bruts, avec `Content-Disposition` configurable
- **Preview d'images** — les images sont affichées directement dans la vue détail de la route
- **Éditeur CodeMirror** — coloration syntaxique et numéros de ligne pour le contenu texte
- **Tags** — taguez vos routes et filtrez par tag dans l'interface et le CLI
- **Tri et pagination** — triez par date, chemin ou nom ; 20 routes par page
- **Limitation de débit** — rate limiting configurable par route (requêtes max / fenêtre)
- **Tableau de bord** — cartes de statistiques et graphique d'activité sur 7 jours
- **Vue grille / liste** — basculez entre une vue en cartes et une liste compacte
- **Logs en temps réel** — logs d'accès par route diffusés via WebSocket avec reconnexion automatique
- **Recherche et export de logs** — filtrez par IP/contenu/méthode, exportez en JSON ou CSV
- **TTL des logs** — les logs d'accès sont automatiquement purgés après 90 jours
- **Contrôle CORS** — config globale dans les paramètres, override par route
- **En-têtes de réponse personnalisés** — valeurs par défaut globales, overridables par route
- **Export / Import** — sauvegardez et restaurez vos routes en JSON, avec chiffrement AES-256 optionnel
- **Clonage de routes** — dupliquez n'importe quelle route vers un chemin choisi ou aléatoire
- **QR code** — générez et téléchargez un QR code pour l'URL de n'importe quelle route
- **Test de routes** — envoyez des requêtes de test depuis l'interface
- **API REST** — API complète sur `/api/v1/` authentifiée par clé API
- **CLI Python** — CLI complet avec mode TUI interactif et complétion shell
- **Support PHP** — évaluation de code PHP pour des réponses dynamiques
- **Admin protégé par JWT** — authentification par session pour le panneau d'administration

---

## Installation

### Prérequis

- [Docker](https://www.docker.com/) et [Docker Compose](https://docs.docker.com/compose/)
- [Python 3.8+](https://www.python.org/) pour le CLI

### Mise en place

```bash
git clone https://github.com/vozec/payload-hoster.git
cd payload-hoster
```

Créez un fichier `.env` à la racine :

```env
PORT=3000
HOSTER_URL=http://localhost:3000
JWT_SECRET=changez_moi
TEMPORARY_DELAY=7

MONGODB_USER=admin
MONGODB_PASSWORD=password

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_PATH=/manager/

API_PATH=/api
API_KEY=cle_api_1,cle_api_2
```

```bash
make rebuild     # reset complet : volumes, frontend, redémarrage
```

Ou sans Make :

```bash
cd admin-frontend && npm run build
docker-compose --env-file .env up --build
```

L'interface d'administration est disponible sur `http://localhost:3000/manager`.

| Cible Make | Description |
|---|---|
| `make rebuild` | Reset complet : supprime tous les volumes (DB incluse), rebuild le frontend, redémarre |
| `make build` | Rebuild uniquement le frontend React |
| `make up` | Démarre le stack Docker |
| `make clean` | Supprime les volumes frontend, conserve MongoDB |
| `make clean-all` | Supprime tous les volumes dont MongoDB |
| `make logs` | Affiche les logs (`service=backend` pour filtrer) |

---

## Interface d'administration

![Tableau de bord](./.github/dashboard.png)

Connectez-vous avec les identifiants définis dans le `.env`. La page d'accueil (Tableau de bord ou Routes) est configurable dans Paramètres > Préférences.

![Routes](./.github/admin-panel.png)

La page Routes supporte la vue grille/liste, le tri, la recherche plein texte et les filtres par tag et catégorie. Cliquez sur une carte pour ouvrir le détail de la route. Les actions (copier l'URL, tester, modifier, cloner, supprimer) sont disponibles directement sur chaque carte. Cliquez sur le nom ou le chemin de la route dans la vue détail pour copier l'URL complète dans le presse-papier.

### Créer une route

![Nouvelle route](./.github/create-route.png)

| Champ | Description |
|---|---|
| Chemin | Chemin de la route (ex. `/ma-route`). Laisser vide pour générer un slug aléatoire. |
| Nom | Auto-généré depuis le chemin si vide. |
| Catégorie | Classique (permanent) ou Temporaire. |
| Type de contenu | HTML, JSON, JS, PHP, XML, texte, ou tout type MIME personnalisé. |
| Encodage | `Texte` — saisissez dans l'éditeur. `Base64`/`Hex` — données encodées brutes, le serveur décode avant de servir. `Fichier` — upload d'un fichier binaire servi tel quel. |
| Tags | Appuyez sur Entrée après chaque tag. |
| Override CORS | En-têtes CORS spécifiques à cette route, écrasent les paramètres globaux. |
| En-têtes personnalisés | En-têtes de réponse additionnels pour cette route uniquement. |
| Content-Disposition | En mode fichier : `inline`, `attachment`, ou valeur personnalisée. |
| Limitation de débit | Throttling optionnel par route (requêtes max / fenêtre en secondes). |

### Détail d'une route et logs

![Logs](./.github/logs.png)

Cliquez sur une route pour voir ses métadonnées et ses logs d'accès. L'onglet logs reçoit les nouvelles requêtes en temps réel via WebSocket (avec indicateur de reconnexion). Les logs sont filtrables par IP, contenu ou méthode HTTP, et exportables en JSON ou CSV. Le QR code et l'export de la route sont disponibles dans l'en-tête. Cliquez sur la prévisualisation du contenu pour accéder directement à la page d'édition.

### Paramètres

| Onglet | Description |
|---|---|
| CORS | `Allow-Origin`, `Allow-Methods`, `Allow-Headers` globaux |
| En-têtes de réponse | En-têtes par défaut envoyés sur toutes les routes dynamiques |
| Préférences | Page d'accueil après connexion |

---

## API REST

Incluez votre clé API dans chaque requête :

```bash
curl http://localhost:3000/api/v1/routes \
  -H "X-API-Key: cle_api_1"
```

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/routes` | Lister toutes les routes |
| GET | `/api/v1/routes/:id` | Récupérer une route |
| POST | `/api/v1/routes` | Créer une route |
| PUT | `/api/v1/routes/:id` | Mettre à jour une route |
| DELETE | `/api/v1/routes/:id` | Supprimer une route |
| POST | `/api/v1/routes/:id/clone` | Cloner une route |
| GET | `/api/v1/stats` | Statistiques système |
| GET | `/api/v1/logs` | Logs d'accès récents |

---

## CLI

### Installation

```bash
pip install -r requirements.txt
chmod +x ./hoster
sudo ln -s "$(pwd)/hoster" /usr/local/bin/hoster
hoster setup --key "cle_api_1" --server "http://localhost:3000/api"
```

### Mode TUI interactif

```bash
hoster ui
```

Interface entièrement guidée par menus pour toutes les opérations, propulsée par `questionary` et `rich`. Également déclenchée en lançant `hoster` sans arguments dans un terminal interactif.

### Commandes

**Upload**

```bash
hoster up payload.html                               # fichier texte
hoster up image.png --file-mode                      # fichier binaire, servi brut
hoster up rapport.pdf --file-mode --disposition "attachment; filename=rapport.pdf"
hoster up data.json --path /api/data --ct json
hoster up script.js --permanent                      # route permanente (temporaire par défaut)
hoster up page.html --tags xss,demo
hoster up page.html -H "X-Frame-Options: DENY"       # en-tête de réponse personnalisé
hoster up binaire.bin --base64                       # stocké en base64, décodé à la lecture
hoster up live.html --watch                          # re-upload automatique à chaque modification
```

**Lister et gérer**

```bash
hoster ls                          # toutes les routes
hoster ls --tag xss
hoster ls --category temporary

hoster rm <nom>                    # supprimer
hoster clone <nom>                 # cloner vers un chemin aléatoire
hoster clone <nom> --path /copie   # cloner vers un chemin précis
hoster open <nom>                  # ouvrir l'URL dans le navigateur par défaut
hoster url <nom>                   # afficher l'URL
hoster test <nom>                  # envoyer une requête test
```

**Modifier**

```bash
hoster edit maroute -c "nouveau contenu"
hoster edit maroute -f fichier.html
hoster edit maroute -n "nouveau nom"
hoster edit maroute --ct json
hoster edit maroute --category classic
```

**Tags**

```bash
hoster tag maroute xss demo
hoster untag maroute demo
```

**CORS**

```bash
hoster cors                                            # voir la config globale
hoster cors --origin "*" --methods "GET,POST"          # modifier la config globale
hoster cors maroute --origin "https://example.com"     # override par route
```

**En-têtes de réponse personnalisés**

```bash
hoster headers maroute --set "X-Custom: valeur"
hoster headers maroute --remove "X-Custom"
```

**Logs**

```bash
hoster logs             # flux live, toutes routes
hoster logs maroute     # route spécifique
```

**Export / Import**

```bash
hoster export routes.json
hoster export routes.enc --password "secret"
hoster import routes.json
hoster import routes.enc --password "secret"
```

**Complétion shell**

```bash
# bash
eval "$(hoster completion --shell bash)"

# zsh
eval "$(hoster completion --shell zsh)"
```

---

## Architecture

```
payload-hoster/
├── src/
│   ├── controllers/         # routeController.js, adminController.js
│   ├── middlewares/         # auth, apiKeyAuth, logger
│   ├── models/              # Route, AccessLog, Config
│   ├── routes/              # admin, apiRoutes, dynamic
│   ├── services/            # WebSocket (Socket.IO)
│   ├── utils/               # phpEvaluator, pathUtils
│   └── app.js
├── admin-frontend/
│   └── src/
│       ├── components/
│       ├── contexts/
│       ├── pages/           # Dashboard, RoutesList, RouteForm, RouteDetails, Settings
│       └── utils/           # tagColors.js, contentTypes.js
├── hoster                   # CLI Python
├── Makefile
├── docker-compose.yml
└── .env
```

## Sécurité

- Sessions JWT pour le panneau d'administration
- Hachage des mots de passe avec bcrypt
- Authentification par en-tête `X-API-Key` pour l'API REST
- Entrées de recherche échappées avant usage dans MongoDB `$regex` (protection ReDoS)
- Chiffrement AES-256-CBC pour les exports de routes

---

<div align="center">

~~Développé~~ par [Vozec](https://github.com/vozec)

</div>
