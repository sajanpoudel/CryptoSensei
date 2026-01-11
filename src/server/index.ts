import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.VITE_PORT || 3001;

// CORS configuration
app.use(cors({
  origin: ['https://crypto-sensei.vercel.app', 'https://crypto-sensei.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// NewsData API configuration with rate limiting
const NEWSDATA_API = 'https://newsdata.io/api/1/news';
const NEWSDATA_API_KEY = process.env.VITE_NEWSDATA_API_KEY;
const NEWS_CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
let lastNewsRequest = 0;
const NEWS_REQUEST_DELAY = 60 * 1000; // 1 minute between requests

const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

app.post('/api/ai/analysis', async (req: Request, res: Response) => {
  const { prompt } = req.body as { prompt?: string };

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  if (!geminiClient) {
    return res.status(500).json({ error: 'Gemini API key not configured' });
  }

  try {
    const result = await geminiClient.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        thinkingConfig: {
          thinkingBudget: 0
        }
      }
    });

    return res.json({ text: result.text ?? '' });
  } catch (error: any) {
    console.error('Gemini API error:', error?.message || error);
    return res.status(500).json({ error: 'Gemini API request failed' });
  }
});

// Add news endpoint with proper error handling and rate limiting
app.get('/api/news/:crypto', async (req: Request, res: Response) => {
  const { crypto } = req.params;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 5;
  const cacheKey = `news-${crypto}-${page}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < NEWS_CACHE_DURATION) {
      return res.json(cached.data);
    }

    // Check rate limit
    const timeSinceLastRequest = Date.now() - lastNewsRequest;
    if (timeSinceLastRequest < NEWS_REQUEST_DELAY) {
      if (cached) {
        return res.json(cached.data);
      }
      return res.status(429).json({ 
        error: 'News API rate limit exceeded',
        retryAfter: Math.ceil((NEWS_REQUEST_DELAY - timeSinceLastRequest) / 1000)
      });
    }

    const response = await axios.get(NEWSDATA_API, {
      params: {
        apikey: NEWSDATA_API_KEY,
        q: `${crypto} AND (price OR trading OR market OR investment) NOT (scam OR hack)`,
        language: 'en',
        page: page,
        size: limit
      }
    });

    if (!response.data || response.data.status !== "success") {
      throw new Error('Invalid response from NewsData API');
    }

    const processedNews = response.data.results
      .slice(0, limit)
      .map((item: any) => ({
        title: item.title,
        source: item.source_name,
        url: item.link,
        timestamp: new Date(item.pubDate).getTime(),
        sentiment: analyzeSentiment(item.title + ' ' + (item.description || '')),
        description: item.description,
        imageUrl: item.image_url
      }));

    cache.set(cacheKey, {
      data: {
        articles: processedNews,
        page,
        totalResults: response.data.totalResults
      },
      timestamp: Date.now()
    });

    lastNewsRequest = Date.now();
    return res.json({ articles: processedNews });
  } catch (error: any) {
    console.error('News API error:', error.response?.data || error.message);
    
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached.data);
    }
    
    return res.status(500).json({ articles: [] });
  }
});

// Improved sentiment analysis function
function analyzeSentiment(text: string): string {
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  let relevantWords = 0;

  const positive = ['bullish', 'surge', 'gain', 'up', 'high', 'rise', 'growth', 'boost', 'rally'];
  const negative = ['bearish', 'drop', 'fall', 'down', 'low', 'crash', 'decline', 'plunge', 'risk'];
  const multipliers = {
    'very': 2,
    'significant': 1.5,
    'massive': 2,
    'slight': 0.5,
    'minor': 0.5
  };

  let multiplier = 1;
  words.forEach((word, index) => {
    // Check for multipliers
    if (multipliers[word as keyof typeof multipliers]) {
      multiplier = multipliers[word as keyof typeof multipliers];
      return;
    }

    // Score calculation
    if (positive.includes(word)) {
      score += 1 * multiplier;
      relevantWords++;
      multiplier = 1;
    } else if (negative.includes(word)) {
      score -= 1 * multiplier;
      relevantWords++;
      multiplier = 1;
    }
  });

  // Normalize score based on relevant words found
  if (relevantWords > 0) {
    score = score / relevantWords;
  }

  // Return sentiment category
  if (score > 0.2) return 'positive';
  if (score < -0.2) return 'negative';
  return 'neutral';
}

// Create WebSocket server attached to HTTP server
const wss = new WebSocketServer({ server });

// CoinGecko API configuration with proper rate limiting
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = {
  PRICE: 2 * 60 * 1000,      // 2 minutes
  HISTORY: 30 * 60 * 1000,   // 30 minutes
  MARKET: 5 * 60 * 1000      // 5 minutes
};

// Rate limiting for CoinGecko
let lastCoinGeckoRequest = 0;
const COINGECKO_REQUEST_DELAY = 6000; // 6 seconds between requests

// Cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

// Price endpoint with proper rate limiting and error handling
app.get('/api/crypto/price/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cacheKey = `price-${id}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.PRICE) {
      console.log('Using cached price data for', id);
      return res.json(cached.data);
    }

    // Check rate limit
    const timeSinceLastRequest = Date.now() - lastCoinGeckoRequest;
    if (timeSinceLastRequest < COINGECKO_REQUEST_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, COINGECKO_REQUEST_DELAY - timeSinceLastRequest)
      );
    }

    // Make request to CoinGecko
    const response = await axios.get(`${COINGECKO_API}/simple/price`, {
      params: {
        ids: id,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
        include_last_updated_at: true
      },
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Crypto Trading Dashboard'
      }
    });

    if (!response.data || !response.data[id]) {
      throw new Error('Invalid response from CoinGecko');
    }

    lastCoinGeckoRequest = Date.now();

    // Format the response
    const data = {
      [id]: {
        usd: response.data[id].usd,
        usd_24h_change: response.data[id].usd_24h_change,
        last_updated_at: response.data[id].last_updated_at,
        market_cap: response.data[id].usd_market_cap
      }
    };

    // Cache the result
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return res.json(data);
  } catch (error: any) {
    console.error('Price API error:', error.response?.data || error.message);
    
    // Try to use cached data if available
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Using stale cache for price data');
      return res.json(cached.data);
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch price data',
      details: error.response?.data?.status?.error_message || error.message
    });
  }
});

// Update the history endpoint to return proper data structure
app.get('/api/crypto/history/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { days = '1' } = req.query;
  const cacheKey = `history-${id}-${days}`;

  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION.HISTORY) {
      return res.json(cached.data);
    }

    // Wait for rate limit if needed
    const timeSinceLastRequest = Date.now() - lastCoinGeckoRequest;
    if (timeSinceLastRequest < COINGECKO_REQUEST_DELAY) {
      await new Promise(resolve => 
        setTimeout(resolve, COINGECKO_REQUEST_DELAY - timeSinceLastRequest)
      );
    }

    // Fetch new data
    const response = await axios.get(`${COINGECKO_API}/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: days,
        interval: 'daily'
      },
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Crypto Trading Dashboard'
      }
    });

    lastCoinGeckoRequest = Date.now();

    if (!response.data || !response.data.prices) {
      throw new Error('Invalid response from CoinGecko');
    }

    // Process and validate the data
    const processedData = {
      prices: response.data.prices.map((item: [number, number]) => ({
        timestamp: item[0],
        price: parseFloat(item[1].toFixed(2))
      })),
      market_caps: response.data.market_caps.map((item: [number, number]) => ({
        timestamp: item[0],
        value: parseFloat(item[1].toFixed(2))
      })),
      total_volumes: response.data.total_volumes.map((item: [number, number]) => ({
        timestamp: item[0],
        value: parseFloat(item[1].toFixed(2))
      })),
      current_price: parseFloat(response.data.prices[response.data.prices.length - 1][1].toFixed(2)),
      price_change_24h: calculatePriceChange(response.data.prices),
      market_cap: parseFloat(response.data.market_caps[response.data.market_caps.length - 1][1].toFixed(2)),
      total_volume: parseFloat(response.data.total_volumes[response.data.total_volumes.length - 1][1].toFixed(2))
    };

    // Validate the processed data
    if (!processedData.prices.length || !processedData.current_price) {
      throw new Error('Invalid data structure');
    }

    // Cache the result
    cache.set(cacheKey, {
      data: processedData,
      timestamp: Date.now()
    });

    console.log('Successfully fetched and processed historical data for', id);
    console.log('Current price:', processedData.current_price);
    console.log('24h change:', processedData.price_change_24h);

    return res.json(processedData);
  } catch (error: any) {
    console.error('History API error:', error.message);
    
    // Try to use cached data if available
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('Using cached historical data for', id);
      return res.json(cached.data);
    }
    
    return res.status(500).json({ 
      error: 'Failed to fetch historical data',
      details: error.response?.data?.status?.error_message || error.message
    });
  }
});

// Helper function to calculate 24h price change
function calculatePriceChange(prices: [number, number][]): number {
  if (prices.length < 2) return 0;
  const currentPrice = prices[prices.length - 1][1];
  const yesterdayPrice = prices[prices.length - 2][1];
  return parseFloat(((currentPrice - yesterdayPrice) / yesterdayPrice * 100).toFixed(2));
}

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  let currentCrypto: string = 'bitcoin';

  const sendPriceUpdate = async () => {
    try {
      const cacheKey = `price-${currentCrypto}`;
      const cached = cache.get(cacheKey);
      
      // Use cached data if fresh
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION.PRICE) {
        ws.send(JSON.stringify(cached.data));
        return;
      }

      // Fetch new price data
      const response = await axios.get(`${COINGECKO_API}/simple/price`, {
        params: {
          ids: currentCrypto,
          vs_currencies: 'usd',
          include_24hr_change: true
        },
        timeout: 5000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Crypto Trading Dashboard'
        }
      });

      if (response.data && response.data[currentCrypto]) {
        const data = {
          [currentCrypto]: {
            usd: response.data[currentCrypto].usd,
            usd_24h_change: response.data[currentCrypto].usd_24h_change
          }
        };

        // Cache the data
        cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });

        // Send to client
        ws.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching price update:', error);
    }
  };

  let updateInterval = setInterval(sendPriceUpdate, 5000);

  ws.on('message', async (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.crypto) {
        currentCrypto = data.crypto;
        clearInterval(updateInterval);
        await sendPriceUpdate(); // Send immediate update
        updateInterval = setInterval(sendPriceUpdate, 5000);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(updateInterval);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running at https://crypto-sensei.vercel.app:${PORT}`);
});

// Error handling
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    process.exit(0);
  });
}); 
