'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TradingStrategy as TradingStrategyType } from '../../services/types'

interface TradingStrategyProps {
  data: TradingStrategyType
}

export const TradingStrategy: React.FC<TradingStrategyProps> = ({ data }) => {
  if (!data || !data.entries || !data.stopLoss || !data.targets) {
    return (
      <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-100">
            Trading Strategy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-neutral-300">Loading trading strategy...</div>
        </CardContent>
      </Card>
    )
  }

  const formatPrice = (price: number | undefined) => 
    `$${(price || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  const recommendationParts = data.recommendation.split('(');
  const recommendation = recommendationParts[0].trim();

  const getRecommendationStyle = (rec: string) => {
    switch (rec.toLowerCase()) {
      case 'buy': return 'bg-white text-black';
      case 'sell': return 'bg-neutral-200 text-neutral-900';
      case 'hold': return 'bg-neutral-800 text-neutral-100';
      default: return 'bg-neutral-700 text-neutral-100';
    }
  };

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold text-neutral-100">
          Trading Strategy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <motion.div 
          className={`text-xl md:text-3xl font-semibold text-center p-3 md:p-4 rounded-lg ${getRecommendationStyle(recommendation)}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {recommendation} ({data.confidence}%)
        </motion.div>

        {/* Entry Points */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm text-neutral-400">Entry Points</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.entries || {}).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="text-xs text-neutral-500 mb-1">{type}</div>
                <div className="font-medium text-neutral-100">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stop Losses */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm text-neutral-400">Stop Loss Levels</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.stopLoss).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              >
                <div className="text-xs text-neutral-500 mb-1">{type}</div>
                <div className="font-medium text-neutral-200">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Targets */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="text-sm text-neutral-400">Price Targets</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(data.targets).map(([type, price], index) => (
              <motion.div 
                key={type} 
                className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
              >
                <div className="text-xs text-neutral-500 mb-1">{type}</div>
                <div className="font-medium text-neutral-100">{formatPrice(price as number)}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rationale */}
        <motion.div 
          className="space-y-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h4 className="text-sm text-neutral-400">Strategy Rationale</h4>
          <div className="space-y-1">
            {data.rationale.map((reason, index) => (
              <motion.div 
                key={index} 
                className="flex items-center gap-2 text-xs text-neutral-500"
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.9 + index * 0.1 }}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                <span>{reason}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
