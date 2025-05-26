<div align="center">

# 🚀 Payload Hoster

![Payload Hoster Logo](./github/logo.png)

*A fast application to create and manage dynamic content and routes with an administration panel and a secure API*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-14.x-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-17.x-61DAFB?logo=react)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4.x-47A248?logo=mongodb)](https://www.mongodb.com/)

</div>

## ✨ Features

- 🌐 **Dynamic Routing** - Create routes with different content types (HTML, JSON, JS, PHP, text, XML)
- 🔒 **Secure Administration** - Authentication-protected admin interface
- 🌳 **Flexible Hierarchy** - Support for routes with multiple levels of depth (/xxx, /xxx/yyy, /xx/yy/zz)
- 📊 **Dashboard** - Visualization of all routes and statistics
- 📝 **Access Logging** - Access logs for each route
- 🔄 **Complete Management** - Modification and deletion of routes
- ⚡ **Real-time** - Real-time logs with WebSocket
- 🔌 **REST API** - Complete API for integration with other services
- 🐍 **Python CLI** - Command-line interface for easy management
- 🐘 **PHP Support** - PHP code evaluation for dynamic content

## 💻 Installation

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/)
- [Git](https://git-scm.com/) (for repository cloning)
- [Python 3.6+](https://www.python.org/) (for CLI usage)

### Installation Steps

1. **Clone the repository**

```bash
git clone https://github.com/vozec/payload-hoster.git
cd payload-hoster
```

2. **Configure environment variables**

Create a `.env` file at the root of the project with the following parameters:

```env
# Server configuration
PORT=3000

# MongoDB configuration
MONGODB_USER=admin
MONGODB_PASSWORD=password

# Administration configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_PATH=/manager/

# API configuration
API_PATH=/api
API_KEY=payload_hoster_secret_api_key_2025
```

3. **Start the application**

```bash
docker-compose --env-file .env up --build
```

The application will be accessible at: [http://localhost:3000](http://localhost:3000)

## 💯 Usage

### 💻 Administration Interface

![Admin Panel](./github/admin-panel.png)

Access the administration interface at: [http://localhost:3000/manager/](http://localhost:3000/manager/)

Log in with the credentials defined in the `.env` file:
- Username: `admin` (default)
- Password: `admin123` (default)

The administration interface allows you to:
- Create, modify, and delete routes
- View access statistics
- Check real-time logs
- Manage application settings

![Logs](./github/logs.png)

### 🔗 REST API

You can access the API programmatically using the API key defined in the `.env` file. Include the API key in your requests using the `X-API-Key` header:

```bash
curl -X GET http://localhost:3000/api/v1/routes \
  -H "X-API-Key: payload_hoster_secret_api_key_2025"
```

#### Available API Endpoints

| Method | Endpoint | Description |
|---------|--------------|-------------|
| GET | `/api/v1/routes` | List all routes |
| GET | `/api/v1/routes/:id` | Retrieve a specific route |
| POST | `/api/v1/routes` | Create a new route |
| PUT | `/api/v1/routes/:id` | Update a route |
| DELETE | `/api/v1/routes/:id` | Delete a route |
| GET | `/api/v1/stats` | Retrieve system statistics |
| GET | `/api/v1/logs` | Retrieve access logs |

### 🐍 Command Line Interface (CLI)

Payload Hoster comes with a Python CLI to facilitate file uploading and route management.

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

#### CLI Installation

```bash
pip install -r requirements.txt
chmod +x ./hoster
sudo ln -s ./hoster /usr/local/bin/hoster
```

#### Configuration

Configure the CLI with your API key and server URL:

```bash
hoster setup --key "payload_hoster_secret_api_key_2025" --server "http://localhost:3000/api"
```

#### File Uploading

**Upload a file** (creates a temporary route with a random path):

```bash
hoster up example.html
# Output: http://localhost:3000/a1b2c3d4/example
```

**Upload a permanent file** (also uses a random path):

```bash
hoster up example.html --permanent
# Output: http://localhost:3000/e5f6g7h8/example
```

Each route receives a unique name with an incremental numeric suffix (e.g., `example_1`, `example_2`) to avoid name collisions.

The difference between temporary and permanent routes lies in their storage category, which affects how they are managed by the server.

**Specify the content type**:

```bash
# Use a shortcut
hoster up data.txt --ct json

# Or specify the full MIME type
hoster up data.txt --content-type application/json

# Upload PHP code
hoster up script.php --ct php
```

#### Route Management

**List all routes**:

```bash
hoster ls
```

**Delete a route by name**:

```bash
hoster rm example_1
```

**Modify route properties**:

```bash
# Modify content directly
hoster edit example_1 -c "New content"

# Modify content from a file
hoster edit example_1 -f new_content.txt

# Change the name
hoster edit example_1 -n "new_name"

# Change the category
hoster edit example_1 --category temporary

# Change the content type
hoster edit example_1 --ct json
```

**Get the full URL of a route**:

```bash
hoster url example_1
```

This command displays only the full URL of the route, making it easy to use in scripts or for copy/paste.

**Monitor access logs in real-time**:

```bash
hoster logs
```

This command connects to the server via WebSocket and displays all incoming requests in real-time. Press Ctrl+C to stop monitoring.

### 📝 Creating a Route via the Web Interface

![Create Route](./github/create-route.png)

1. Log in to the administration interface
2. Click on "New Route" in the menu
3. Fill out the form:
   - **Path**: the route path (e.g., /my-route)
   - **Name**: a descriptive name for the route
   - **Content Type**: HTML, JSON, PHP, text, or XML
   - **Content**: the content that will be served when the route is accessed
4. Click on "Create"

### 🌐 Accessing Dynamic Routes

Created routes are directly accessible at their path:
- [http://localhost:3000/my-route](http://localhost:3000/my-route)
- [http://localhost:3000/api/products](http://localhost:3000/api/products)
- etc.

#### PHP Support

Routes with the PHP content type are evaluated by the integrated PHP server. You can use all standard PHP features, including functions like `header()` for redirections or setting custom headers.

**PHP Code Example**:

```php
<?php
// Redirect to another page
header('Location: /other-page');
exit;
?>
```

```php
<?php
// Generate dynamic JSON
header('Content-Type: application/json');
$data = [
    'success' => true,
    'message' => 'Hello from PHP!',
    'timestamp' => time()
];
echo json_encode($data);
?>
```

## 🛠️ Project Architecture

```
│── admin-frontend/          # React frontend for administration
│   │── public/              # Static resources
│   │── src/                 # React source code
│   └── package.json         # npm dependencies for frontend
│
│── src/
│   │── controllers/         # Express controllers
│   │── middlewares/         # Middlewares (auth, logger, etc.)
│   │── models/              # Mongoose models
│   │── routes/              # Express routes
│   │── services/            # Services (WebSocket, etc.)
│   │── utils/               # Utilities (PHP evaluator, etc.)
│   └── app.js               # Application entry point
│
│── hoster                # Python CLI
│── .env                     # Environment variables
│── docker-compose.yml       # Docker configuration
│── Dockerfile.backend       # Dockerfile for backend
│── package.json             # npm dependencies for backend
└── README.md                # Documentation
```

## 🔒 Security

- **JWT Authentication** - The administration interface is protected by JWT tokens
- **Password Hashing** - Passwords are hashed with bcrypt
- **Protected Routes** - Administration routes require authentication
- **Request Validation** - All API requests are validated
- **API Key** - API endpoints can be accessed with an API key for programmatic access
- **Configurable CORS** - CORS headers for dynamic routes

## 👨‍💻 Development

For development, you can run separately:

```bash
# Backend
npm run dev

# Frontend
cd admin-frontend
npm start
```

## 📖 License

[MIT](./LICENSE)

---

<div align="center">

👍 ~~Developed~~ Vibecoded by [Vozec](https://github.com/vozec) 👍

</div>
