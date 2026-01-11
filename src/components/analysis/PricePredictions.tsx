'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PredictionData } from '@/services/types'

interface PricePredictionsData {
  shortTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  midTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  longTerm: {
    price: { low: number; high: number }
    confidence: number
    signals: string[]
  }
  externalPredictions?: PredictionData[]
}

interface PricePredictionsProps {
  data: PricePredictionsData
}

export const PricePredictions: React.FC<PricePredictionsProps> = ({ data }) => {
  if (!data) {
    return (
      <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-100">
            Price Predictions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-neutral-300">Loading predictions...</div>
        </CardContent>
      </Card>
    )
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 70) return 'bg-white text-black'
    if (confidence >= 50) return 'bg-neutral-700 text-neutral-100'
    return 'bg-neutral-800 text-neutral-200'
  }

  const formatPrice = (price: number) => 
    `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`

  const timeframes = [
    { key: 'shortTerm', label: 'Short Term' },
    { key: 'midTerm', label: 'Mid Term' },
    { key: 'longTerm', label: 'Long Term' }
  ] as const

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-100">
          Price Predictions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {timeframes.map(({ key, label }, index) => (
          <motion.div 
            key={key} 
            className="bg-neutral-900/60 p-4 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">{label}</span>
              <motion.div 
                className={`px-2 py-1 rounded-full text-sm ${getConfidenceColor(data[key].confidence)}`}
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 + index * 0.1 }}
              >
                {data[key].confidence.toFixed(1)}% confidence
              </motion.div>
            </div>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-neutral-100">
                <span className="text-neutral-500">Range: </span>
                <span className="font-medium text-neutral-100">
                  {formatPrice(data[key].price.low)} - {formatPrice(data[key].price.high)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-neutral-400">
                {data[key].price.high > data[key].price.low ? 'Upward bias' : 'Downward bias'}
              </div>
            </div>
            {data[key].signals.length > 0 && (
              <div className="text-xs text-neutral-500">
                {data[key].signals[0]}
              </div>
            )}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  )
}
