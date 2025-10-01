# Setup Guide for Live Voting System

## Quick Start

Follow these steps to get the voting system running with Keycloak authentication and Redis database.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Redis Database

You have several options:

### Option A: Use Redis Cloud (Recommended for Production)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a new database (free tier available)
3. Copy your connection string (format: `redis://username:password@host:port`)
4. Add it to `.env.local`

### Option B: Local Redis (For Development)

1. Install Redis locally:
   - **macOS**: `brew install redis`
   - **Ubuntu/Debian**: `sudo apt-get install redis-server`
   - **Windows**: Download from [Redis website](https://redis.io/download)

2. Start Redis:
   ```bash
   redis-server
   ```

3. Use this connection string:
   ```
   STORAGE_REDIS_URL="redis://localhost:6379"
   ```

### Option C: Other Redis Providers

- **Upstash**: Serverless Redis with free tier
- **Railway**: Easy deployment with Redis addon
- **AWS ElastiCache**: For AWS deployments
- **DigitalOcean Managed Redis**: Simple managed Redis

## Step 3: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Environment Variables

The application requires these environment variables:

```bash
# Redis Database
STORAGE_REDIS_URL="redis://username:password@host:port"

# NextAuth - Generate secret with: openssl rand -base64 32
AUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Keycloak (HTL Leonding)
KEYCLOAK_CLIENT_SECRET="not-needed-for-public-client"
```

Create a `.env.local` file in the root directory with these variables.

**Generate AUTH_SECRET:**
```bash
openssl rand -base64 32
```

## Testing Without Database

If you want to test without setting up Redis, you can:
1. Install Redis locally (see Option B above) - quickest option
2. Or temporarily modify `/app/api/votes/route.ts` to use in-memory storage (not recommended)

## Troubleshooting

### "Cannot connect to Redis" error

- Make sure your `.env.local` file exists and has the correct Redis URL
- Restart the development server after adding environment variables
- Verify your Redis server is running (if using local Redis)
- Check your connection string format: `redis://username:password@host:port`

### Keycloak authentication not working

- Ensure you're accessing the app from the correct URL (matching NEXTAUTH_URL)
- Check that the Keycloak server is accessible: https://auth.htl-leonding.ac.at
- Verify the client ID is correct: `htlleonding-service`
- Make sure AUTH_SECRET is set and is a valid base64 string
- Try clearing browser cookies and cache

### Changes not persisting

- Check that your Redis database is properly connected
- Verify environment variables are loaded (check terminal output)
- Ensure your Redis server has enough memory
- Check if Redis is running: `redis-cli ping` (should return "PONG")

### SSE not working

- Server-Sent Events require HTTP/2 or HTTP/1.1 with keep-alive
- Check browser console for SSE connection logs ("SSE Connected", "SSE Error")
- The client automatically reconnects every 3 seconds if connection drops
- Heartbeat messages are sent every 15 seconds to keep connection alive
- Some proxies/firewalls may block SSE connections - try accessing directly
- If using nginx or similar reverse proxy, ensure SSE buffering is disabled (X-Accel-Buffering: no)

## Production Deployment

1. Push to GitHub
2. Choose your hosting platform (Vercel, Railway, etc.)
3. Set environment variables:
   - `STORAGE_REDIS_URL` - Production Redis connection string
   - `AUTH_SECRET` - Generate a new secure secret for production
   - `NEXTAUTH_URL` - Your production URL (e.g., https://yourdomain.com)
   - `KEYCLOAK_CLIENT_SECRET` - Use "not-needed-for-public-client" or actual secret if configured
4. Deploy!

**Important for Production:**
- Use a strong, unique `AUTH_SECRET`
- Ensure NEXTAUTH_URL matches your actual domain
- Configure Keycloak redirect URIs to include your production URL
- Use secure Redis connection (TLS/SSL)

Your application will be live with secure authentication, persistent storage, and real-time updates!

