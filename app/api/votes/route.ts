import { NextRequest, NextResponse } from 'next/server';
import { createClient } from 'redis';

interface VoteOption {
  id: string;
  text: string;
  votes: number;
  voters: string[];
  createdBy: string;
  createdAt: number;
}

interface VoteData {
  options: VoteOption[];
  lastUpdate: number;
}

const VOTE_DATA_KEY = 'vote-system:data';

// Store SSE clients
const clients = new Set<(data: string) => void>();

// Redis client singleton
let redisClient: ReturnType<typeof createClient> | null = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.STORAGE_REDIS_URL
    });
    
    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    
    await redisClient.connect();
  }
  
  return redisClient;
}

// Initialize default data if not exists
async function initializeData(): Promise<VoteData> {
  const client = await getRedisClient();
  const existingData = await client.get(VOTE_DATA_KEY);

  if (!existingData) {
    return {
      options: [],
      lastUpdate: Date.now()
    };
  }
  
  return JSON.parse(existingData);
}

async function getVoteData(): Promise<VoteData> {
  const client = await getRedisClient();
  const data = await client.get(VOTE_DATA_KEY);
  if (!data) {
    return await initializeData();
  }
  return JSON.parse(data);
}

async function saveVoteData(data: VoteData): Promise<void> {
  const client = await getRedisClient();
  await client.set(VOTE_DATA_KEY, JSON.stringify(data));
}

export async function notifyClients() {
  const voteData = await getVoteData();
  const data = JSON.stringify(voteData);
  clients.forEach(sendData => {
    try {
      console.log(`[notifyClients] Notifying client with data: ${data}`);
      sendData(data);
    } catch (error) {
      // Client disconnected, will be cleaned up
    }
  });
}

export function addClient(sendData: (data: string) => void) {
  clients.add(sendData);
}

export function removeClient(sendData: (data: string) => void) {
  clients.delete(sendData);
}

// GET - Fetch current votes
export async function GET() {
  const voteData = await getVoteData();
  return NextResponse.json(voteData);
}

// POST - Add vote or add option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, optionId, newOption, userName } = body;

    if (!userName || userName.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const voteData = await getVoteData();

    if (action === 'vote') {
      const option = voteData.options.find(opt => opt.id === optionId);
      if (!option) {
        return NextResponse.json(
          { error: 'Option not found' },
          { status: 404 }
        );
      }

      // Check if user already voted for this option
      if (option.voters.includes(userName)) {
        return NextResponse.json(
          { error: 'You have already voted for this option' },
          { status: 400 }
        );
      }

      option.votes++;
      option.voters.push(userName);
      voteData.lastUpdate = Date.now();

      // Save to Redis
      await saveVoteData(voteData);

      // Notify all connected clients
      await notifyClients();

      return NextResponse.json({ success: true, data: voteData });
    } else if (action === 'removeVote') {
      const option = voteData.options.find(opt => opt.id === optionId);
      if (!option) {
        return NextResponse.json(
          { error: 'Option not found' },
          { status: 404 }
        );
      }

      // Check if user has voted for this option
      if (!option.voters.includes(userName)) {
        return NextResponse.json(
          { error: 'You have not voted for this option' },
          { status: 400 }
        );
      }

      // Remove vote
      option.votes = Math.max(0, option.votes - 1);
      option.voters = option.voters.filter(voter => voter !== userName);
      voteData.lastUpdate = Date.now();

      // Save to Redis
      await saveVoteData(voteData);

      // Notify all connected clients
      await notifyClients();

      return NextResponse.json({ success: true, data: voteData });
    } else if (action === 'addOption') {
      if (!newOption || newOption.trim() === '') {
        return NextResponse.json(
          { error: 'Option text is required' },
          { status: 400 }
        );
      }

      const newId = String(Date.now());
      voteData.options.push({
        id: newId,
        text: newOption.trim(),
        votes: 0,
        voters: [],
        createdBy: userName,
        createdAt: Date.now()
      });
      voteData.lastUpdate = Date.now();

      // Save to Vercel KV
      await saveVoteData(voteData);

      // Notify all connected clients
      await notifyClients();

      return NextResponse.json({ success: true, data: voteData });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

