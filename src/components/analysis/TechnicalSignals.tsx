'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TechnicalSignals as TechnicalSignalsType } from '../../services/types'

interface TechnicalSignalsProps {
  data: TechnicalSignalsType
}

export const TechnicalSignals: React.FC<TechnicalSignalsProps> = ({ data }) => {
  const getTrendColor = (trend: string | number) => {
    const trendStr = String(trend).toLowerCase();
    switch (trendStr) {
      case 'bullish': return 'text-neutral-100'
      case 'bearish': return 'text-neutral-300'
      default: return 'text-neutral-400'
    }
  }

  const getSignalColor = (signal: string) => {
    if (signal.includes('bullish') || signal.includes('overbought')) return 'text-neutral-100'
    if (signal.includes('bearish') || signal.includes('oversold')) return 'text-neutral-300'
    return 'text-neutral-400'
  }

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-100">
          Technical Signals
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Trend Analysis */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h4 className="text-sm text-neutral-400">Trend Analysis</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(data.trend).map(([type, trend], index) => (
              <motion.div 
                key={type} 
                className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="text-xs text-neutral-500 mb-1">{type}</div>
                <div className={`font-medium ${getTrendColor(trend)}`}>
                  {trend}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Momentum */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-sm text-neutral-400">Momentum</h4>
          <div className="space-y-2">
            {Object.entries(data.momentum).map(([indicator, data], index) => (
              <motion.div 
                key={indicator} 
                className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">{indicator.toUpperCase()}</span>
                  <span className={`text-sm ${getSignalColor(data.signal)}`}>
                    {data.value.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs mt-1 text-neutral-500">
                  {data.signal}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Volatility */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h4 className="text-sm text-neutral-400">Volatility</h4>
          <motion.div 
            className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">Current</span>
              <span className={`text-sm ${
                data.volatility.risk === 'high' ? 'text-neutral-100' :
                data.volatility.risk === 'medium' ? 'text-neutral-300' :
                'text-neutral-400'
              }`}>
                {data.volatility.current.toFixed(2)}%
              </span>
            </div>
            <div className="text-xs text-neutral-500">
              {data.volatility.trend} trend, {data.volatility.risk} risk
            </div>
          </motion.div>
        </motion.div>

        {/* Volume Analysis */}
        <motion.div 
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <h4 className="text-sm text-neutral-400">Volume Analysis</h4>
          <motion.div 
            className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.7 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">Change</span>
              <span className={`text-sm ${
                data.volume.change > 1.5 ? 'text-neutral-100' :
                data.volume.change < 0.5 ? 'text-neutral-300' :
                'text-neutral-400'
              }`}>
                {data.volume.change.toFixed(2)}x
              </span>
            </div>
            <div className="text-xs text-neutral-500">
              {data.volume.trend} trend, {data.volume.significance} significance
            </div>
          </motion.div>
        </motion.div>
      </CardContent>
    </Card>
  )
}
