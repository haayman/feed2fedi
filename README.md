# Feed2Fedi - Self-hosted Fediverse ActivityPub Server

A self-hosted Fediverse/ActivityPub server with automatic RSS feed posting capabilities. Built with NestJS backend and Nuxt 3 frontend.

## Features

- **ActivityPub Compatible** - Full ActivityPub protocol implementation for Fediverse compatibility
- **Multiple Accounts** - Manage multiple Fediverse accounts on different instances
- **RSS Automation** - Automatically post RSS feed items to your Fediverse accounts
- **Job Scheduling** - Scheduled feed fetching with configurable intervals
- **Web Interface** - Modern Nuxt 3 dashboard for account and feed management
- **REST API** - Complete REST API with JWT authentication

## Project Structure

```
feed2fedi/
├── apps/
│   ├── backend/          # NestJS backend server
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── accounts/     # Account management
│   │   │   │   ├── feeds/        # RSS feed management
│   │   │   │   ├── posts/        # Post management
│   │   │   │   ├── activitypub/  # ActivityPub protocol
│   │   │   │   └── auth/         # Authentication
│   │   │   └── main.ts           # Application entry point
│   │   └── package.json
│   └── frontend/         # Nuxt 3 frontend
│       ├── pages/
│       ├── components/
│       ├── assets/
│       └── package.json
├── package.json          # Root workspace
└── tsconfig.json
```

## Prerequisites

- Node.js 18+
- pnpm 10.6.5+
- PostgreSQL 12+ (for production)

## Getting Started

### Installation

```bash
# Install dependencies
pnpm install
```

### Configuration

Create `.env.local` in the root directory:

```env
# Backend
NODE_ENV=development
PORT=3001
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=feed2fedi
DB_PASSWORD=password
DB_NAME=feed2fedi

# Fediverse
FEDIVERSE_INSTANCE=your-instance.com
```

### Development

```bash
# Start both backend and frontend in development mode
pnpm dev

# Or individually:
# Backend: http://localhost:3001
# Frontend: http://localhost:3000
# API Docs: http://localhost:3001/api
```

### Building

```bash
# Build both applications
pnpm build

# Build individually
pnpm -F @feed2fedi/backend build
pnpm -F @feed2fedi/frontend build
```

## API Endpoints

### Accounts

- `POST /accounts` - Create new account
- `GET /accounts` - List all accounts
- `GET /accounts/:id` - Get account details
- `DELETE /accounts/:id` - Delete account

### Feeds

- `POST /feeds` - Add RSS feed
- `GET /feeds` - List all feeds
- `GET /feeds/:id` - Get feed details
- `GET /feeds/account/:accountId` - Get account's feeds
- `DELETE /feeds/:id` - Delete feed

### Posts

- `POST /posts` - Create post
- `GET /posts` - List all posts
- `GET /posts/:id` - Get post details
- `POST /posts/:id/publish` - Publish post to Fediverse
- `DELETE /posts/:id` - Delete post

### ActivityPub

- `GET /.well-known/webfinger` - WebFinger endpoint
- `GET /users/:username` - Get actor profile
- `POST /users/:username/inbox` - Receive activities

## Docker Setup (Coming Soon)

Docker configuration for containerized deployment.

## Architecture

### Backend (NestJS)

- **TypeORM** - Database ORM
- **Passport.js** - Authentication
- **RSS Parser** - Feed parsing
- **Crypto** - RSA key generation for ActivityPub signing

### Frontend (Nuxt 3)

- **Tailwind CSS** - Styling
- **Pinia** - State management
- **Axios** - HTTP client
- **Nuxt Icon** - Icon library

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
