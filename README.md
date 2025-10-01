# Live Voting System

A beautiful, real-time voting application built with Next.js, Server-Sent Events, and Vercel KV database. Features Apple-inspired glassmorphism design and live updates across all connected clients.

## Features

- 🔐 **Keycloak Authentication**: Secure SSO authentication with HTL Leonding Keycloak
- ✨ **Real-time Updates**: Uses Server-Sent Events (SSE) with automatic reconnection for reliable synchronization
- 🎨 **Glassmorphism UI**: Beautiful Apple-inspired glass design with smooth animations
- 💾 **Persistent Storage**: Data stored in Redis database
- 👤 **User Identity**: Authenticated users with real names from Keycloak
- 🗳️ **Vote Tracking**: Prevents duplicate votes from the same user
- 🔄 **Vote Management**: Add or remove your vote at any time
- ➕ **Dynamic Options**: Anyone can add new voting options
- 📊 **Visual Progress**: Animated progress bars showing vote percentages
- 👥 **Transparency**: See who created each option and who voted

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Keycloak
- **Database**: Redis
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Vercel (or any Node.js hosting)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Redis database (local or cloud-hosted)

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Set up Redis database:

   You can use:
   - **Local Redis**: Install Redis locally and use `redis://localhost:6379`
   - **Redis Cloud**: Sign up at [Redis Cloud](https://redis.com/try-free/) for free hosted Redis
   - **Other providers**: Upstash, AWS ElastiCache, etc.

3. Create a `.env.local` file and add your configuration:

```bash
# Redis Database
STORAGE_REDIS_URL="redis://username:password@host:port"

# NextAuth
AUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Keycloak (for HTL Leonding)
KEYCLOAK_CLIENT_SECRET="not-needed-for-public-client"
```

Generate the AUTH_SECRET with:
```bash
openssl rand -base64 32
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variable `STORAGE_REDIS_URL` with your Redis connection string
4. Deploy!

### Deploy to Other Platforms

This app can be deployed to any platform that supports Node.js:
- Vercel
- Netlify
- Railway
- Heroku
- DigitalOcean App Platform
- AWS, GCP, Azure, etc.

Just ensure your Redis database is accessible and set the `STORAGE_REDIS_URL` environment variable.

## Usage

1. **Sign In**: Click "Sign in with Keycloak" and authenticate with your HTL Leonding account
2. **Voting**: Click the "Vote" button on any option to cast your vote
3. **Remove Vote**: Click "Remove Vote" to revoke your vote (button appears after voting)
4. **Adding Options**: Click "+ Add New Option" to create a new voting option
5. **View Details**: Click "Show voters" to see who voted for each option
6. **Real-time Updates**: Watch as votes update instantly across all devices
7. **Sign Out**: Click the door icon (🚪) next to your name to sign out

## API Routes

- `GET /api/votes` - Fetch current voting data
- `POST /api/votes` - Cast a vote, remove a vote, or add a new option
  - Action: `vote` - Cast a vote for an option
  - Action: `removeVote` - Remove your vote from an option
  - Action: `addOption` - Create a new voting option
- `GET /api/events` - SSE endpoint for real-time updates

## Project Structure

```
vote-system/
├── app/
│   ├── api/
│   │   ├── events/
│   │   │   └── route.ts      # SSE endpoint
│   │   └── votes/
│   │       └── route.ts       # Voting API with KV storage
│   ├── globals.css            # Global styles and animations
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Main voting UI
├── .env.local                 # Environment variables (not in git)
├── .env.example               # Example environment variables
└── README.md
```

## License

MIT

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests.
