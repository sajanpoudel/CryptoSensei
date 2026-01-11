import { TradingStrategy } from '../types';

export const strategyGenerator = {
  async generateStrategy(data: {
    currentPrice: number;
    marketCondition: any;
    technicalSignals: any;
    sentimentAnalysis: any;
    riskAnalysis: any;
    predictions: any;
  }): Promise<TradingStrategy> {
    try {
      const { currentPrice, marketCondition, technicalSignals } = data;

      // Ensure currentPrice is valid
      if (!currentPrice || isNaN(currentPrice)) {
        throw new Error('Invalid current price');
      }

      // Use marketCondition to calculate entries
      const conservative = this.calculateConservativeEntry(
        currentPrice, 
        technicalSignals, 
        marketCondition.keyLevels // Use key levels from market condition
      );
      
      const aggressive = this.calculateAggressiveEntry(
        currentPrice, 
        technicalSignals, 
        marketCondition.keyLevels // Use key levels from market condition
      );

      const entries = {
        conservative: Number(conservative.toFixed(2)),
        moderate: Number(currentPrice.toFixed(2)),
        aggressive: Number(aggressive.toFixed(2))
      };

      // Validate entries
      if (isNaN(entries.aggressive) || entries.aggressive === 0) {
        entries.aggressive = Number((currentPrice * 1.02).toFixed(2));
      }

      // Use market condition for recommendation
      const { recommendation, confidence } = this.determineRecommendation(
        technicalSignals, 
        marketCondition
      );

      // Calculate stop loss based on market condition
      const stopLoss = {
        tight: Number((currentPrice * (1 - this.calculateStopLossDistance(marketCondition, 'tight'))).toFixed(2)),
        normal: Number((currentPrice * (1 - this.calculateStopLossDistance(marketCondition, 'normal'))).toFixed(2)),
        wide: Number((currentPrice * (1 - this.calculateStopLossDistance(marketCondition, 'wide'))).toFixed(2))
      };

      // Calculate targets based on market condition
      const targets = {
        primary: Number((currentPrice * (1 + this.calculateTargetDistance(marketCondition, 'primary'))).toFixed(2)),
        secondary: Number((currentPrice * (1 + this.calculateTargetDistance(marketCondition, 'secondary'))).toFixed(2)),
        final: Number((currentPrice * (1 + this.calculateTargetDistance(marketCondition, 'final'))).toFixed(2))
      };

      const rationale = this.generateRationale(technicalSignals, marketCondition);

      return {
        recommendation: `${recommendation} (${confidence}%)`,
        confidence,
        entries,
        stopLoss,
        targets,
        timeframe: this.determineTimeframe(technicalSignals, marketCondition),
        rationale
      };
    } catch (error) {
      console.error('Error generating strategy:', error);
      return this.getDefaultStrategy();
    }
  },

  calculateStopLossDistance(marketCondition: any, type: 'tight' | 'normal' | 'wide'): number {
    const volatility = marketCondition.strength || 0.5;
    const multipliers = {
      tight: 2,
      normal: 3,
      wide: 5
    };
    return (volatility * multipliers[type]) / 100;
  },

  calculateTargetDistance(marketCondition: any, type: 'primary' | 'secondary' | 'final'): number {
    const trend = marketCondition.phase.toLowerCase();
    const strength = marketCondition.strength || 0.5;
    
    const baseMultipliers = {
      primary: 3,
      secondary: 5,
      final: 8
    };

    // Adjust multipliers based on market phase
    const trendMultiplier = trend === 'bull market' ? 1.5 :
                           trend === 'bear market' ? 0.5 : 1;

    return (baseMultipliers[type] * strength * trendMultiplier) / 100;
  },

  determineRecommendation(technicalSignals: any, marketCondition: any): { recommendation: string; confidence: number } {
    const { rsi, macd } = technicalSignals.momentum;
    const trendRaw = technicalSignals.trend.primary ?? 'neutral';
    const trend = String(trendRaw).toLowerCase();
    const marketPhase = String(marketCondition.phase ?? 'neutral').toLowerCase();
    const rsiValue = typeof rsi?.value === 'number' ? rsi.value : 50;
    const macdSignal = String(macd?.signal ?? '').toLowerCase();
    const baseConfidence = Math.round(this.calculateConfidence(technicalSignals, marketCondition));

    let recommendation = 'Hold';
    let confidence = Math.min(95, Math.max(35, baseConfidence));

    if (rsiValue > 70 && trend.includes('bullish')) {
      recommendation = 'Take Profit';
      confidence = Math.max(confidence, Math.min(90, rsiValue));
    } else if (rsiValue < 30 && trend.includes('bearish')) {
      recommendation = 'Buy';
      confidence = Math.max(confidence, Math.min(90, 100 - rsiValue));
    } else if (trend.includes('bullish') && (macdSignal.includes('bullish') || rsiValue > 55)) {
      recommendation = 'Buy';
      confidence = Math.max(confidence, 65);
    } else if (trend.includes('bearish') && (macdSignal.includes('bearish') || rsiValue < 45)) {
      recommendation = 'Sell';
      confidence = Math.max(confidence, 65);
    } else if (marketPhase.includes('accumulation')) {
      recommendation = 'Buy';
      confidence = Math.max(confidence, 60);
    } else if (marketPhase.includes('distribution')) {
      recommendation = 'Sell';
      confidence = Math.max(confidence, 60);
    }

    if (macdSignal.includes('bullish') && recommendation === 'Buy') {
      confidence += 8;
    } else if (macdSignal.includes('bearish') && recommendation === 'Sell') {
      confidence += 8;
    }

    confidence = Math.min(95, Math.round(confidence * 100) / 100);

    return { recommendation, confidence };
  },

  calculateConfidence(technicalSignals: any, marketCondition: any): number {
    const trendStrength = technicalSignals.trend.strength * 100;
    const marketStrength = marketCondition.strength * 100;
    const momentumStrength = 
      (technicalSignals.momentum.rsi.value > 50 ? 60 : 40) +
      (technicalSignals.momentum.macd.value > 0 ? 10 : -10);

    return Math.min(95, Math.max(30,
      (trendStrength * 0.4 + marketStrength * 0.3 + momentumStrength * 0.3)
    ));
  },

  calculateConservativeEntry(
    currentPrice: number, 
    technicalSignals: any, 
    keyLevels: any
  ): number {
    // Use key levels from market condition for support
    const support = keyLevels.support || currentPrice * 0.95;
    const volatility = technicalSignals.volatility.current / 100;
    
    // Conservative entry near support level
    return Math.max(
      support,
      currentPrice * (1 - Math.min(0.05, volatility)) // Max 5% below current price
    );
  },

  calculateAggressiveEntry(
    currentPrice: number, 
    technicalSignals: any, 
    keyLevels: any
  ): number {
    // Use key levels from market condition for resistance
    const resistance = keyLevels.resistance || currentPrice * 1.05;
    const volatility = technicalSignals.volatility.current / 100;
    
    // Aggressive entry should be between current price and resistance
    const entryPoint = currentPrice * (1 + Math.min(0.03, volatility)); // Max 3% above current price
    
    // Ensure entry doesn't exceed resistance
    return Math.min(entryPoint, resistance);
  },

  calculateStopLoss(price: number, percentage: number): number {
    return price * (1 - percentage);
  },

  calculateTarget(price: number, percentage: number): number {
    return price * (1 + percentage);
  },

  determineTimeframe(technicalSignals: any, marketCondition: any): string {
    const volatility = technicalSignals.volatility.current;
    const marketPhase = marketCondition.phase.toLowerCase();
    const strength = marketCondition.strength || 0.5;

    // Determine timeframe based on market conditions
    if (marketPhase === 'bull market' && strength > 0.7) {
      return volatility > 50 ? 'Short-term' : 'Medium-term';
    } else if (marketPhase === 'bear market' && strength > 0.7) {
      return 'Long-term';
    } else if (marketPhase === 'accumulation') {
      return 'Medium-term';
    } else if (marketPhase === 'distribution') {
      return 'Short-term';
    }

    // Default based on volatility
    return volatility > 50 ? 'Short-term' : 
           volatility < 20 ? 'Long-term' : 'Medium-term';
  },

  generateRationale(technicalSignals: any, marketCondition: any): string[] {
    const rationale: string[] = [];
    
    // Add market phase rationale
    rationale.push(`Market Phase: ${marketCondition.phase} with ${(marketCondition.strength * 100).toFixed(1)}% strength`);
    
    // Add technical signals
    rationale.push(`RSI: ${technicalSignals.momentum.rsi.signal}`);
    rationale.push(`MACD: ${technicalSignals.momentum.macd.signal}`);
    
    // Add market structure
    if (marketCondition.keyLevels) {
      rationale.push(`Support at $${marketCondition.keyLevels.support.toFixed(2)}`);
      rationale.push(`Resistance at $${marketCondition.keyLevels.resistance.toFixed(2)}`);
    }

    // Add trend strength
    if (technicalSignals.trend.strength > 0.7) {
      rationale.push(`Strong ${technicalSignals.trend.primary} trend`);
    }

    return rationale;
  },

  getDefaultStrategy(): TradingStrategy {
    const defaultPrice = 76000;
    return {
      recommendation: 'Hold',
      confidence: 50,
      entries: {
        conservative: defaultPrice * 0.98,
        moderate: defaultPrice,
        aggressive: defaultPrice * 1.02
      },
      stopLoss: {
        tight: defaultPrice * 0.95,
        normal: defaultPrice * 0.97,
        wide: defaultPrice * 0.93
      },
      targets: {
        primary: defaultPrice * 1.03,
        secondary: defaultPrice * 1.05,
        final: defaultPrice * 1.08
      },
      timeframe: 'Medium-term',
      rationale: ['Using default strategy due to insufficient data']
    };
  }
};
