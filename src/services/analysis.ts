import { api } from "./api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface TechnicalIndicators {
  currentPrice: number;
  price_change_24h: number;
  rsi: number;
  macd: {
    value: number;
    signal: number;
    histogram: number;
    interpretation: string;
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

interface DetailedAnalysis {
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

interface ParsedSections {
  summary: string[];
  predictions: {
    shortTerm: string;
    midTerm: string;
    longTerm: string;
  };
  signals: Array<{ text: string; type: string }>;
  strategy: Array<{
    position: string;
    entry: string;
    stop: string;
    target: string;
  }>;
  reasoning: string[];
}

class AnalysisService {
  private async getHistoricalData(crypto: string, days: number = 200) {
    try {
      console.log(`Fetching historical data for ${crypto}...`);
      const historicalData = await api.getHistoricalData(crypto, days);
      console.log('Historical data response:', historicalData);
      
      return historicalData;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    for (let i = 1; i < period + 1; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        gains += difference;
      } else {
        losses -= difference;
      }
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const difference = prices[i] - prices[i - 1];
      if (difference >= 0) {
        avgGain = (avgGain * 13 + difference) / period;
        avgLoss = (avgLoss * 13) / period;
      } else {
        avgGain = (avgGain * 13) / period;
        avgLoss = (avgLoss * 13 - difference) / period;
      }
    }

    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateMACD(prices: number[]) {
    const ema12 = this.calculateEMA(prices, 12);
    const ema26 = this.calculateEMA(prices, 26);
    const macdSeries = ema12.map((value, index) => value - ema26[index]);
    const macdLine = macdSeries[macdSeries.length - 1];
    const signalSeries = this.calculateEMA(macdSeries, 9);
    const signalLine = signalSeries[signalSeries.length - 1];
    const histogram = macdLine - signalLine;
    
    return {
      value: macdLine,
      signal: signalLine,
      histogram,
      interpretation: this.interpretMACD(macdLine, signalLine, histogram)
    };
  }

  private interpretMACD(macdLine: number, signalLine: number, histogram: number): string {
    let interpretation = '';
    const strengthThreshold = Math.max(0.01, Math.abs(macdLine) * 0.1);

    if (histogram > 0) {
      interpretation = Math.abs(histogram) > strengthThreshold
        ? 'Strong bullish momentum' 
        : 'Bullish momentum';
    } else {
      interpretation = Math.abs(histogram) > strengthThreshold
        ? 'Strong bearish momentum' 
        : 'Bearish momentum';
    }

    if (macdLine > 0 && signalLine > 0) {
      interpretation += ', upward trend';
    } else if (macdLine < 0 && signalLine < 0) {
      interpretation += ', downward trend';
    }

    if (Math.abs(macdLine - signalLine) < 0.1) {
      interpretation += ', potential trend reversal';
    }

    return interpretation;
  }

  private calculateEMA(prices: number[], period: number): number[] {
    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push(
        (prices[i] - ema[i - 1]) * multiplier + ema[i - 1]
      );
    }

    return ema;
  }

  private calculateSMA(prices: number[], period: number = 20): number {
    if (!prices || prices.length === 0) return 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
  }

  private findSupportResistance(prices: number[]) {
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const q1Index = Math.floor(prices.length * 0.25);
    const q3Index = Math.floor(prices.length * 0.75);

    return {
      support: sortedPrices[q1Index],
      resistance: sortedPrices[q3Index]
    };
  }

  private async getMarketSentiment(crypto: string) {
    try {
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news; // Extract the news array
      
      const positiveCount = newsItems.filter(n => n.sentiment === 'positive').length;
      const negativeCount = newsItems.filter(n => n.sentiment === 'negative').length;
      const total = newsItems.length || 1;

      const newsScore = (positiveCount / total) * 100;
      return {
        newsScore,
        socialScore: Math.min(100, Math.max(0, newsScore)),
        marketMood: positiveCount > negativeCount ? 'Bullish' : 
                   negativeCount > positiveCount ? 'Bearish' : 'Neutral'
      };
    } catch (error) {
      console.error('Error getting market sentiment:', error);
      return {
        newsScore: 50,
        socialScore: 50,
        marketMood: 'Neutral'
      };
    }
  }

  private calculateStochRSI(prices: number[], period: number = 14): number {
    const rsiValues = [];
    let minRSI = Infinity;
    let maxRSI = -Infinity;
    
    // Calculate RSI values
    for (let i = period; i < prices.length; i++) {
      const rsi = this.calculateRSI(prices.slice(i - period, i + 1));
      rsiValues.push(rsi);
      minRSI = Math.min(minRSI, rsi);
      maxRSI = Math.max(maxRSI, rsi);
    }

    // Calculate Stochastic RSI
    const lastRSI = rsiValues[rsiValues.length - 1];
    const range = maxRSI - minRSI;
    if (!Number.isFinite(range) || range === 0) {
      return 50;
    }
    return ((lastRSI - minRSI) / range) * 100;
  }

  private interpretStochRSI(stochRSI: number): string {
    if (stochRSI > 80) return 'Extremely overbought';
    if (stochRSI > 60) return 'Overbought';
    if (stochRSI < 20) return 'Extremely oversold';
    if (stochRSI < 40) return 'Oversold';
    return 'Neutral';
  }

  private calculateOBV(prices: number[], volumes: number[]): string {
    let obv = 0;
    const obvValues = [0];

    for (let i = 1; i < prices.length; i++) {
      if (prices[i] > prices[i - 1]) {
        obv += volumes[i];
      } else if (prices[i] < prices[i - 1]) {
        obv -= volumes[i];
      }
      obvValues.push(obv);
    }

    // Determine trend
    const recentOBV = obvValues.slice(-5);
    const trend = recentOBV[recentOBV.length - 1] > recentOBV[0] ? 'Bullish' : 'Bearish';
    return trend;
  }

  private calculateVolumeRatio(volumes: number[], period: number = 20): number {
    const currentVolume = volumes[volumes.length - 1];
    const avgVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
    return currentVolume / avgVolume;
  }

  private determineMarketPhase(prices: number[], ma50: number, ma200: number): string {
    const currentPrice = prices[prices.length - 1];
    const priceAboveMA50 = currentPrice > ma50;
    const priceAboveMA200 = currentPrice > ma200;
    const ma50AboveMA200 = ma50 > ma200;

    if (priceAboveMA50 && priceAboveMA200 && ma50AboveMA200) {
      return 'Bull Market';
    } else if (!priceAboveMA50 && !priceAboveMA200 && !ma50AboveMA200) {
      return 'Bear Market';
    } else if (priceAboveMA200 && !priceAboveMA50) {
      return 'Correction';
    } else {
      return 'Accumulation';
    }
  }

  private calculateVolatility(prices: number[]): number {
    const returns = prices.slice(1).map((price, i) => 
      Math.log(price / prices[i])
    );
    
    return Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret, 2), 0) / returns.length
    ) * Math.sqrt(365) * 100;
  }

  private async getAIAnalysis(
    crypto: string,
    technicalIndicators: TechnicalIndicators,
    news: any[],
    sentiment: any
  ): Promise<string> {
    const prompt = `
      Act as an expert quantitative analyst and cryptocurrency trader. Analyze the following comprehensive market data for ${crypto} and provide a detailed strategic analysis:

      PRICE ACTION & TECHNICAL ANALYSIS:
      • Current Price: ${technicalIndicators.currentPrice} USD
      • 24h Change: ${technicalIndicators.price_change_24h}%
      • Key Moving Averages:
        - MA20: ${technicalIndicators.ma20}
        - MA50: ${technicalIndicators.ma50}
        - MA200: ${technicalIndicators.ma200}
      
      MOMENTUM INDICATORS:
      • RSI(14): ${technicalIndicators.rsi} - ${this.interpretRSI(technicalIndicators.rsi)}
      • MACD: 
        - Value: ${technicalIndicators.macd.value}
        - Signal: ${technicalIndicators.macd.signal}
        - Histogram: ${technicalIndicators.macd.histogram}
      • Volume Change: ${technicalIndicators.volumeChange}%
      
      MARKET STRUCTURE:
      • Current Market Phase: ${technicalIndicators.marketPhase}
      • Volatility: ${technicalIndicators.volatility}%
      • Key Price Levels:
        - Support: ${technicalIndicators.support}
        - Resistance: ${technicalIndicators.resistance}
      
      MARKET SENTIMENT:
      • News Sentiment Score: ${sentiment.newsScore}%
      • Market Mood: ${sentiment.marketMood}
      • Recent News Headlines:
      ${news.slice(0, 3).map(n => `  - ${n.title} (${n.sentiment})`).join('\n')}
      
      Based on this comprehensive data, provide a detailed analysis in the following HTML structure. Be extremely analytical and precise, focusing on actionable insights:

      <div class="analysis">
        <div class="summary">
          <h3>Strategic Market Analysis</h3>
          <p class="highlight">[Provide a concise but detailed 2-3 line summary of the current market situation, incorporating price action, technical indicators, and sentiment. Be specific about the market phase and key levels.]</p>
        </div>

        <div class="signals">
          <h3>Critical Trading Signals</h3>
          <ul>
            <li class="signal-item [positive/negative/neutral]">[Technical Signal: Describe specific technical setup or pattern]</li>
            <li class="signal-item [positive/negative/neutral]">[Momentum Signal: Describe momentum status and implications]</li>
            <li class="signal-item [positive/negative/neutral]">[Volume Signal: Describe volume analysis and its significance]</li>
            <li class="signal-item [positive/negative/neutral]">[Sentiment Signal: Describe sentiment impact on price]</li>
          </ul>
        </div>

        <div class="strategy">
          <h3>Strategic Recommendations</h3>
          <div class="position-strategy">
            [Provide specific entry, exit, and position management recommendations based on all available data]
          </div>
          <div class="risk-management">
            <div class="entry">Entry Zones: $[Specify optimal entry ranges with reasoning]</div>
            <div class="stop">Stop Loss: $[Specify stop loss levels with technical justification]</div>
            <div class="target">Targets: $[Specify multiple price targets with technical justification]</div>
          </div>
          <div class="timeframe">
            [Specify optimal trading timeframe based on volatility and market phase]
          </div>
        </div>
      </div>

      Important Guidelines:
      1. Base all analysis on quantitative data provided
      2. Highlight specific technical setups and patterns
      3. Provide concrete price levels for all recommendations
      4. Include risk management considerations
      5. Consider market structure and phase in all recommendations
      6. Integrate sentiment analysis with technical signals
      7. Be precise with numbers and percentages
      8. Focus on actionable insights
      9. Maintain professional, analytical tone
      10. Use technical terminology appropriately

      Remove any markdown formatting and ensure all price levels are properly formatted with $ symbol.
    `;

    const response = await fetch(`${API_BASE_URL}/api/ai/analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`AI analysis failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.text ?? "";
  }

  private interpretRSI(rsi: number): string {
    if (rsi >= 70) return 'Overbought - Consider taking profits';
    if (rsi <= 30) return 'Oversold - Potential buying opportunity';
    if (rsi >= 60) return 'Bullish momentum building';
    if (rsi <= 40) return 'Bearish pressure present';
    return 'Neutral momentum';
  }

  private calculateConfidence(
    rsi: number,
    macd: { value: number; signal: number; histogram: number },
    volumeRatio: number,
    sentiment: any,
    volatilityIndex: number
  ): number {
    // RSI confidence (0-100)
    const rsiConfidence = (() => {
      if (rsi > 70 || rsi < 30) return 90; // Strong signal (overbought/oversold)
      if (rsi > 60 || rsi < 40) return 75; // Moderate signal
      return 50; // Neutral
    })();

    // MACD confidence (0-100)
    const macdConfidence = (() => {
      const signalDenominator = Math.max(0.01, Math.abs(macd.signal));
      const signalStrength = Math.abs(macd.histogram) / signalDenominator;
      const normalizedStrength = Math.min(100, signalStrength * 100);
      return normalizedStrength;
    })();

    // Volume confidence (0-100)
    const volumeConfidence = (() => {
      if (volumeRatio > 2) return 90; // Very high volume
      if (volumeRatio > 1.5) return 80; // High volume
      if (volumeRatio > 1) return 70; // Above average
      if (volumeRatio > 0.7) return 50; // Normal
      return 30; // Low volume
    })();

    // Sentiment confidence (0-100)
    const sentimentConfidence = (() => {
      const newsScore = sentiment.newsScore || 50;
      const socialScore = sentiment.socialScore || 50;
      return (newsScore + socialScore) / 2;
    })();

    // Volatility impact (0-1)
    const volatilityFactor = Math.max(0.5, 1 - (volatilityIndex / 100));

    // Weight the different components
    const weights = {
      rsi: 0.25,
      macd: 0.25,
      volume: 0.20,
      sentiment: 0.20,
      volatility: 0.10
    };

    // Calculate weighted confidence
    const weightedConfidence = (
      (rsiConfidence * weights.rsi) +
      (macdConfidence * weights.macd) +
      (volumeConfidence * weights.volume) +
      (sentimentConfidence * weights.sentiment)
    ) * volatilityFactor;

    // Ensure confidence is between 30 and 95
    return Math.min(95, Math.max(30, weightedConfidence));
  }

  async getDetailedAnalysis(crypto: string): Promise<DetailedAnalysis> {
    try {
      const historicalData = await this.getHistoricalData(crypto);
      const prices = historicalData.prices;
      const volumes = historicalData.volumes;
      const currentPrice = historicalData.current_price;

      // Calculate all technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      
      // Calculate moving averages
      const movingAverages = {
        ma20: this.calculateSMA(prices, 20),
        ma50: this.calculateSMA(prices, 50),
        ma200: this.calculateSMA(prices, 200)
      };

      const { support, resistance } = this.findSupportResistance(prices);
      const volumeRatio = this.calculateVolumeRatio(volumes);
      const volatilityIndex = this.calculateVolatility(prices);
      const stochRSI = this.calculateStochRSI(prices);
      const obvTrend = this.calculateOBV(prices, volumes);
      const marketPhase = this.determineMarketPhase(prices, movingAverages.ma50, movingAverages.ma200);

      // Create technical indicators object with calculated MAs
      const technicalIndicators: TechnicalIndicators = {
        currentPrice,
        price_change_24h: historicalData.price_change_24h,
        rsi,
        macd: {
          value: macd.value,
          signal: macd.signal,
          histogram: macd.histogram,
          interpretation: macd.interpretation
        },
        ma20: movingAverages.ma20,
        ma50: movingAverages.ma50,
        ma200: movingAverages.ma200,
        volumeChange: volumeRatio,
        marketPhase,
        volatility: volatilityIndex,
        support,
        resistance
      };

      // Updated market summary with date-based formatting and current trend lines
      const latestDateIndex = prices.length - 1;
      const latestPrice = prices[latestDateIndex];
      const marketSummary = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} as of ${new Date().toLocaleDateString()} is in a ${marketPhase} phase, trading at $${latestPrice.toFixed(2)}. RSI is ${rsi.toFixed(2)} (${this.interpretRSI(rsi)}), with MACD indicating ${macd.interpretation}. The volume trend is ${obvTrend} with a ${volumeRatio.toFixed(2)}x change compared to the average volume.`;

      // Get market sentiment and news
      const sentiment = await this.getMarketSentiment(crypto);
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news; // Extract the news array

      // Generate signals based on all indicators
      const signals = [
        {
          indicator: 'RSI',
          value: rsi,
          signal: this.interpretRSI(rsi),
          strength: rsi > 70 || rsi < 30 ? 0.8 : 0.5
        },
        {
          indicator: 'MACD',
          value: macd.value,
          signal: macd.interpretation,
          strength: Math.abs(macd.histogram) > 0.1 ? 0.8 : 0.5
        },
        {
          indicator: 'StochRSI',
          value: stochRSI,
          signal: this.interpretStochRSI(stochRSI),
          strength: stochRSI > 80 || stochRSI < 20 ? 0.8 : 0.5
        },
        {
          indicator: 'OBV',
          value: 0,
          signal: obvTrend,
          strength: 0.5
        },
        {
          indicator: 'Market Phase',
          value: 0,
          signal: marketPhase,
          strength: 0.7
        }
      ];

      // Generate AI analysis
      const aiAnalysis = await this.getAIAnalysis(
        crypto,
        technicalIndicators,
        newsItems, // Pass the news array
        sentiment
      );

      // Parse AI analysis
      const parsedAnalysis = this.parseAIAnalysis(aiAnalysis);

      // Calculate confidence for each timeframe
      const shortTermConfidence = this.calculateConfidence(rsi, macd, volumeRatio, sentiment, volatilityIndex);
      const midTermConfidence = Math.max(30, shortTermConfidence * 0.9); // Slightly lower confidence for mid-term
      const longTermConfidence = Math.max(30, shortTermConfidence * 0.8); // Even lower for long-term
      const volatility = this.calculateVolatility(prices);

      // Calculate price targets
      const priceTargets = {
        shortTerm: {
          low: currentPrice * (1 - volatility * 0.1),
          high: currentPrice * (1 + volatility * 0.1)
        },
        midTerm: {
          low: currentPrice * (1 - volatility * 0.2),
          high: currentPrice * (1 + volatility * 0.2)
        },
        longTerm: {
          low: currentPrice * (1 - volatility * 0.3),
          high: currentPrice * (1 + volatility * 0.3)
        }
      };

      return {
        summary: parsedAnalysis.summary[0] || marketSummary,
        aiAnalysis,
        priceTargets: {
          '24H': {
            range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
            confidence: shortTermConfidence.toString()
          },
          '7D': {
            range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
            confidence: midTermConfidence.toString()
          },
          '30D': {
            range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
            confidence: longTermConfidence.toString()
          }
        },
        signals: signals.map(s => ({
          text: `${s.indicator}: ${s.signal}`,
          importance: s.strength > 0.7 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        strategy: {
          position: marketPhase === 'Bull Market' ? 'Long' : 'Short',
          entry: (support + (resistance - support) * 0.382).toString(),
          stop: (support * 0.95).toString(),
          target: resistance.toString()
        },
        marketStructure: {
          trend: marketPhase
        }
      };
    } catch (error) {
      console.error('Error in analysis service:', error);
      throw error;
    }
  }

  private parseAIAnalysis(html: string): ParsedSections {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections: ParsedSections = {
      summary: [],
      predictions: {
        shortTerm: '',
        midTerm: '',
        longTerm: ''
      },
      signals: [],
      strategy: [],
      reasoning: []
    };

    try {
      // Parse summary
      const summaryElement = doc.querySelector('.summary p.highlight');
      if (summaryElement?.textContent) {
        sections.summary = [summaryElement.textContent.trim()];
      }

      // Parse predictions
      const predictionsDiv = doc.querySelector('.predictions');
      if (predictionsDiv) {
        const shortTerm = predictionsDiv.querySelector('.prediction.short .price');
        const midTerm = predictionsDiv.querySelector('.prediction.medium .price');
        const longTerm = predictionsDiv.querySelector('.prediction.long .price');

        sections.predictions = {
          shortTerm: shortTerm?.textContent?.trim() || '',
          midTerm: midTerm?.textContent?.trim() || '',
          longTerm: longTerm?.textContent?.trim() || ''
        };
      }

      // Parse signals
      const signalsList = doc.querySelectorAll('.signals .signal-item');
      signalsList.forEach(signal => {
        const type = signal.classList.contains('positive') ? 'positive' :
                     signal.classList.contains('negative') ? 'negative' : 'neutral';
        sections.signals.push({
          text: signal.textContent?.trim() || '',
          type
        });
      });

      // Parse strategy
      const strategyDiv = doc.querySelector('.strategy');
      if (strategyDiv) {
        const position = strategyDiv.querySelector('.position-strategy')?.textContent?.trim();
        const entry = strategyDiv.querySelector('.risk-management .entry')?.textContent?.trim();
        const stop = strategyDiv.querySelector('.risk-management .stop')?.textContent?.trim();
        const target = strategyDiv.querySelector('.risk-management .target')?.textContent?.trim();

        if (position || entry || stop || target) {
          sections.strategy.push({
            position: position || 'N/A',
            entry: entry || 'N/A',
            stop: stop || 'N/A',
            target: target || 'N/A'
          });
        }
      }

      // Combine all relevant information into reasoning
      sections.reasoning = [
        ...sections.summary,
        ...sections.signals.map(s => s.text),
        ...(sections.strategy.length > 0 ? [
          `Position: ${sections.strategy[0].position}`,
          `Entry: ${sections.strategy[0].entry}`,
          `Stop: ${sections.strategy[0].stop}`,
          `Target: ${sections.strategy[0].target}`
        ] : [])
      ].filter(Boolean);

    } catch (error) {
      console.error('Error parsing AI analysis:', error);
    }

    return sections;
  }

  async getFullAnalysis(crypto: string): Promise<DetailedAnalysis> {
    try {
      // Fetch historical data
      const historicalData = await api.getHistoricalData(crypto);
      console.log('Fetching historical data for', crypto, '...');
      console.log('Historical data response:', historicalData);

      const prices = historicalData.prices;
      const volumes = historicalData.volumes;
      const currentPrice = historicalData.current_price;

      // Calculate technical indicators
      const rsi = this.calculateRSI(prices);
      const macd = this.calculateMACD(prices);
      const stochRSI = this.calculateStochRSI(prices);
      const ma50 = this.calculateSMA(prices, 50);
      const ma200 = this.calculateSMA(prices, 200);
      const { support, resistance } = this.findSupportResistance(prices);
      const volumeRatio = this.calculateVolumeRatio(volumes);
      const volatility = this.calculateVolatility(prices);
      const obvTrend = this.calculateOBV(prices, volumes);
      const marketPhase = this.determineMarketPhase(prices, ma50, ma200);

      // Calculate market sentiment
      const sentiment = await this.getMarketSentiment(crypto);
      const newsResponse = await api.getNews(crypto);
      const newsItems = newsResponse.news;

      // Calculate price targets
      const priceTargets = {
        shortTerm: {
          low: currentPrice * (1 - volatility * 0.1),
          high: currentPrice * (1 + volatility * 0.1)
        },
        midTerm: {
          low: currentPrice * (1 - volatility * 0.2),
          high: currentPrice * (1 + volatility * 0.2)
        },
        longTerm: {
          low: currentPrice * (1 - volatility * 0.3),
          high: currentPrice * (1 + volatility * 0.3)
        }
      };

      // Generate signals based on all indicators
      const signals = [
        {
          indicator: 'RSI',
          value: rsi,
          signal: this.interpretRSI(rsi),
          strength: Math.abs(50 - rsi) / 50
        },
        {
          indicator: 'MACD',
          value: macd.value,
          signal: macd.interpretation,
          strength: Math.abs(macd.value / currentPrice)
        },
        {
          indicator: 'StochRSI',
          value: stochRSI,
          signal: this.interpretStochRSI(stochRSI),
          strength: Math.abs(50 - stochRSI) / 50
        },
        {
          indicator: 'OBV',
          value: 0,
          signal: obvTrend,
          strength: volumeRatio - 1
        }
      ];

      // Generate AI analysis
      const technicalIndicators: TechnicalIndicators = {
        currentPrice,
        price_change_24h: historicalData.price_change_24h,
        rsi,
        macd: {
          value: macd.value,
          signal: macd.signal,
          histogram: macd.histogram,
          interpretation: macd.interpretation
        },
        ma20: this.calculateSMA(prices, 20),
        ma50,
        ma200,
        volumeChange: volumeRatio,
        marketPhase,
        volatility: volatility,
        support,
        resistance
      };

      const aiAnalysis = await this.getAIAnalysis(
        crypto,
        technicalIndicators,
        newsItems, // Pass the news array
        sentiment
      );

      // Updated market summary with date-based formatting and current trend lines
      const latestDateIndex = prices.length - 1;
      const latestPrice = prices[latestDateIndex];
      const marketSummary = `${crypto.charAt(0).toUpperCase() + crypto.slice(1)} as of ${new Date().toLocaleDateString()} is in a ${marketPhase.toLowerCase()} with ${
        signals[0].signal.toLowerCase()
      } momentum and a ${macd.interpretation.toLowerCase()}. Price is ${
        latestPrice > ma50 ? 'above' : 'below'
      } most moving averages, indicating ${
        latestPrice > ma50 && latestPrice > ma200 ? 'bullish momentum' : 'potential trend reversal'
      }.`;

      console.log('Price Targets Calculation:', {
        currentPrice,
        volatility,
        momentum: signals[0].strength,
        rsi,
        macd: macd.value,
        stochRSI
      });
      const baseConfidence = parseFloat((85 - volatility / 2).toFixed(2));

      return {
        summary: marketSummary,
        aiAnalysis,
        priceTargets: {
          '24H': {
            range: `$${priceTargets.shortTerm.low.toFixed(2)} - $${priceTargets.shortTerm.high.toFixed(2)}`,
            confidence: baseConfidence.toString()
          },
          '7D': {
            range: `$${priceTargets.midTerm.low.toFixed(2)} - $${priceTargets.midTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.9).toString()
          },
          '30D': {
            range: `$${priceTargets.longTerm.low.toFixed(2)} - $${priceTargets.longTerm.high.toFixed(2)}`,
            confidence: Math.max(30, baseConfidence * 0.8).toString()
          }
        },
        signals: signals.map(s => ({
          text: `${s.indicator}: ${s.signal}`,
          importance: s.strength > 0.7 ? 'high' : s.strength > 0.4 ? 'medium' : 'low'
        })),
        strategy: {
          position: marketPhase === 'Bull Market' ? 'Long' : 'Short',
          entry: (support + (resistance - support) * 0.382).toString(),
          stop: (support * 0.95).toString(),
          target: resistance.toString()
        },
        marketStructure: {
          trend: marketPhase
        }
      };
    } catch (error) {
      console.error('Error in analysis:', error);
      throw error;
    }
  }
}

export const analysisService = new AnalysisService();
