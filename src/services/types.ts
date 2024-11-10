export interface CryptoPrice {
  price: number;
  timestamp: number;
  change24h: number;
}

export interface NewsItem {
  title: string;
  source: string;
  url: string;
  timestamp: number;
  sentiment: string;
  description?: string;
  imageUrl?: string;
  sentimentStats?: {
    positive: number;
    neutral: number;
    negative: number;
  };
  aiTags?: string[];
}

export interface SentimentData {
  source: string;
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  volume: number;
  timestamp: number;
}

export interface PredictionData {
  period: 'Short-term' | 'Mid-term' | 'Long-term';
  price: number;
  confidence: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface RiskFactors {
  volatility: number;
  trend: number;
  volume: number;
  news: number;
  social: number;
  market: number;
}

export interface TradingStrategy {
  recommendation: string;
  confidence: number;
  entries: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  stopLoss: {
    tight: number;
    normal: number;
    wide: number;
  };
  targets: {
    primary: number;
    secondary: number;
    final: number;
  };
  timeframe: string;
  rationale: string[];
}

export interface TechnicalIndicators {
  currentPrice: number;
  price_change_24h: number;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
  };
  ma20: number;
  ma50: number;
  ma200: number;
  volumeChange: number;
  marketPhase: string;
  volatility: number;
  support: number;
  resistance: number;
}

export interface TechnicalSignals {
  trend: {
    primary: string;
    secondary: string;
    strength: number;
  };
  momentum: {
    rsi: { 
      value: number; 
      signal: string; 
    };
    macd: { 
      value: number; 
      signal: string; 
    };
    stochRSI: { 
      value: number; 
      signal: string; 
    };
  };
  volatility: {
    current: number;
    trend: string;
    risk: 'low' | 'medium' | 'high';
  };
  volume: {
    change: number;
    trend: string;
    significance: 'weak' | 'moderate' | 'strong';
  };
}

interface PredictionResult {
  price: { low: number; high: number };
  confidence: number;
  signals: string[];
}

interface MarketPhase {
  phase: string;
  strength: number;
  confidence: number;
  keyLevels: {
    strongSupport: number;
    support: number;
    pivot: number;
    resistance: number;
    strongResistance: number;
  };
}

export interface DetailedAnalysis {
  summary: string;
  aiAnalysis: string;
  priceTargets: {
    '24H': { range: string; confidence: string };
    '7D': { range: string; confidence: string };
    '30D': { range: string; confidence: string };
  };
  signals: Array<{
    text: string;
    importance: string;
  }>;
  strategy: {
    position: string;
    entry: string;
    stop: string;
    target: string;
  };
  marketStructure: {
    trend: string;
  };
}

interface AnalysisData {
  summary: string;
  aiAnalysis: string;
  priceTargets: {
    '24H': { range: string; confidence: string };
    '7D': { range: string; confidence: string };
    '30D': { range: string; confidence: string };
  };
  signals: Array<{
    text: string;
    importance: string;
  }>;
  strategy: {
    position: string;
    entry: string;
    stop: string;
    target: string;
  };
  marketStructure: {
    trend: string;
  };
} 