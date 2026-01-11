import React, { useEffect, useState } from 'react';
import { analysisService } from '../services/analysis';
import { motion } from 'framer-motion';
import { PredictionData } from '@/services/types';

interface MarketAnalysisProps {
  crypto: string;
  predictions: PredictionData[];
}

interface Signal {
  text: string;
  importance: string;
}

interface AnalysisData {
  summary: string;
  aiAnalysis: string;
  priceTargets: {
    '24H': { range: string; confidence: string };
    '7D': { range: string; confidence: string };
    '30D': { range: string; confidence: string };
    externalPredictions: PredictionData[];
  };
  signals: Signal[];
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

const formatAIAnalysis = (htmlContent: string) => {
  // Extract sections using more precise regex patterns
  const sections = {
    marketAnalysis: htmlContent.match(/<p class="highlight">(.*?)<\/p>/s)?.[1] || '',
    signals: htmlContent
      .split('Critical Trading Signals')[1]
      ?.split('Strategic Recommendations')[0]
      ?.split('\n')
      .filter(line => 
        line.trim() && 
        !line.includes('h3') && 
        !line.includes('ul') && 
        !line.includes('div') && 
        line.length > 10 // Filter out very short lines
      )
      .map(signal => signal.replace(/<[^>]*>/g, '').trim())
      .filter(Boolean) || [], // Filter out empty strings
    strategy: {
      overview: htmlContent
        .split('Strategic Recommendations')[1]
        ?.split('Entry Zones')[0]
        ?.replace(/<[^>]*>/g, '')
        .trim() || '',
      entry: htmlContent.match(/Entry Zones[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      stop: htmlContent.match(/Stop Loss[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      targets: htmlContent.match(/Targets[:\s]*([^<\n]*)/)?.[1]?.trim() || '',
      timeframe: htmlContent.match(/Timeframe[:\s]*([^<\n]*)/)?.[1]?.trim() || ''
    }
  };

  return (
    <div className="space-y-6">
      {/* Market Analysis Section */}
      {sections.marketAnalysis && (
        <div className="border-l-2 border-neutral-700 pl-4">
          <h4 className="text-lg font-semibold text-neutral-100 mb-2">Strategic Market Analysis</h4>
          <p className="text-neutral-300 leading-relaxed">{sections.marketAnalysis}</p>
        </div>
      )}

      {/* Trading Signals Section - Only show if there are signals */}
      {sections.signals.length > 0 && (
        <div className="border-l-2 border-neutral-700 pl-4">
          <h4 className="text-lg font-semibold text-neutral-100 mb-2">Critical Trading Signals</h4>
          <ul className="space-y-3">
            {sections.signals.map((signal, index) => (
              <li key={index} className="flex items-start gap-2 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                <span className="mt-2 h-1.5 w-1.5 rounded-full bg-neutral-500" />
                <span className="text-neutral-300">{signal}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Strategy Section - Only show if there's content */}
      {(sections.strategy.overview || sections.strategy.entry || sections.strategy.targets) && (
        <div className="border-l-2 border-neutral-700 pl-4">
          <h4 className="text-lg font-semibold text-neutral-100 mb-2">Strategic Recommendations</h4>
          
          {/* Strategy Overview */}
          {sections.strategy.overview && (
            <div className="mb-4 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
              <p className="text-neutral-300 leading-relaxed">{sections.strategy.overview}</p>
            </div>
          )}

          {/* Key Levels Grid - Only show if there are values */}
          {(sections.strategy.entry || sections.strategy.stop || sections.strategy.targets) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {sections.strategy.entry && (
                <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
                  <h5 className="text-sm font-semibold text-neutral-100 mb-2 flex items-center gap-2">
                    Entry Zones
                  </h5>
                  <p className="text-neutral-300">{sections.strategy.entry}</p>
                </div>
              )}

              {sections.strategy.stop && (
                <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
                  <h5 className="text-sm font-semibold text-neutral-100 mb-2 flex items-center gap-2">
                    Stop Loss
                  </h5>
                  <p className="text-neutral-300">{sections.strategy.stop}</p>
                </div>
              )}

              {sections.strategy.targets && (
                <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
                  <h5 className="text-sm font-semibold text-neutral-100 mb-2 flex items-center gap-2">
                    Targets
                  </h5>
                  <p className="text-neutral-300">{sections.strategy.targets}</p>
                </div>
              )}
            </div>
          )}

          {/* Timeframe - Only show if there's a value */}
          {sections.strategy.timeframe && (
            <div className="bg-neutral-900/60 p-4 rounded-lg border border-neutral-800">
              <h5 className="text-sm font-semibold text-neutral-100 mb-2 flex items-center gap-2">
                Timeframe
              </h5>
              <p className="text-neutral-300">{sections.strategy.timeframe}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const MarketAnalysis: React.FC<MarketAnalysisProps> = ({ crypto, predictions }) => {
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await analysisService.getDetailedAnalysis(crypto);
        if (!result) {
          throw new Error('No analysis data available');
        }

        // Merge external predictions with analysis data
        const mergedAnalysis = {
          ...result,
          priceTargets: {
            ...result.priceTargets,
            externalPredictions: predictions
          }
        };

        setAnalysis(mergedAnalysis);
      } catch (err) {
        console.error('Error in MarketAnalysis:', err);
        setError('Failed to fetch market analysis');
        setAnalysis({
          summary: 'Market analysis unavailable',
          aiAnalysis: 'AI analysis unavailable',
          priceTargets: {
            '24H': { range: 'N/A', confidence: '0' },
            '7D': { range: 'N/A', confidence: '0' },
            '30D': { range: 'N/A', confidence: '0' },
            externalPredictions: predictions
          },
          signals: [],
          strategy: {
            position: 'Neutral',
            entry: 'N/A',
            stop: 'N/A',
            target: 'N/A'
          },
          marketStructure: {
            trend: 'Neutral'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [crypto, predictions]); // Only depend on crypto and predictions changes

  if (loading) {
    const loadingSteps = [
      { 
        text: "Collecting market data and price history...",
        color: "bg-neutral-200"
      },
      { 
        text: "Analyzing technical indicators and patterns...",
        color: "bg-neutral-300"
      },
      { 
        text: "Processing market sentiment and volume data...",
        color: "bg-neutral-400"
      },
      { 
        text: "Calculating risk metrics and support/resistance...",
        color: "bg-neutral-500"
      },
      { 
        text: "Generating price predictions and strategies...",
        color: "bg-neutral-600"
      }
    ];

    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] relative">
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-neutral-900/40 via-neutral-950/60 to-neutral-900/40 rounded-lg"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />

        {/* Loading steps container */}
        <div className="relative z-10 space-y-4 w-full max-w-2xl p-6">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -50 }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: {
                  delay: index * 0.5 // Sequential appearance
                }
              }}
              className="flex items-center gap-4 bg-neutral-900/60 p-4 rounded-lg backdrop-blur-sm border border-neutral-800"
            >
              <motion.div
                className={`h-2.5 w-2.5 rounded-full ${step.color}`}
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.4
                }}
              />

              {/* Text animation */}
              <motion.span
                className="text-sm font-medium text-neutral-200"
                animate={{
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.5
                }}
              >
                {step.text}
              </motion.span>

              {/* Progress indicator */}
              <motion.div
                className="ml-auto h-1.5 rounded-full bg-neutral-200/60"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{
                  duration: 2,
                  delay: index * 0.5,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Additional loading info */}
      
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-neutral-900 text-neutral-300 p-3 rounded-lg mb-4 border border-neutral-800">
          {error}
        </div>
      )}

      {/* Market Summary - only show if there's content */}
      {analysis?.summary && (
        <div className="bg-neutral-900/60 rounded-lg p-4 border border-neutral-800">
          <h3 className="font-medium flex items-center gap-2 mb-3 text-neutral-100">
            Market Summary
          </h3>
          <div className="prose prose-invert max-w-none">
            <p className="text-neutral-200">{analysis.summary}</p>
          </div>
        </div>
      )}

      {/* AI Analysis - only show if there's content */}
      {analysis?.aiAnalysis && (
        <div className="bg-neutral-900/60 rounded-lg p-4 border border-neutral-800">
          <h3 className="font-medium flex items-center gap-2 mb-4 text-neutral-100">
            AI Analysis
          </h3>
          {analysis.aiAnalysis ? 
            formatAIAnalysis(analysis.aiAnalysis)
            : null
          }
        </div>
      )}

      {/* Key Signals - only show if there are signals */}
      {analysis?.signals && analysis.signals.length > 0 && (
        <div className="bg-neutral-900/60 rounded-lg p-4 border border-neutral-800">
          <h3 className="font-medium flex items-center gap-2 mb-3 text-neutral-100">
            Key Signals
          </h3>
          <div className="space-y-2">
            {analysis.signals.map((signal: Signal, index: number) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-900 text-neutral-200 border border-neutral-800">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                <span>{signal.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only show empty state if no data at all */}
      {!analysis?.summary && !analysis?.aiAnalysis && (!analysis?.signals || analysis.signals.length === 0) && (
        <div className="bg-neutral-900/60 rounded-lg p-4 text-center border border-neutral-800">
          <p className="text-neutral-400">No analysis data available</p>
        </div>
      )}
    </div>
  );
}; 
