'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface MarketPhaseProps {
  data: {
    phase: string
    strength: number
    confidence: number
    keyLevels: {
      strongSupport: number
      support: number
      pivot: number
      resistance: number
      strongResistance: number
    }
  }
}

export const MarketPhase: React.FC<MarketPhaseProps> = ({ data }) => {
  if (!data || !data.keyLevels) {
    return (
      <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-semibold text-neutral-100">
            Market Phase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-neutral-300">Loading market phase data...</div>
        </CardContent>
      </Card>
    )
  }
  
  const getPhaseStyle = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'accumulation': return 'bg-neutral-200 text-neutral-900'
      case 'markup': return 'bg-white text-black'
      case 'distribution': return 'bg-neutral-700 text-neutral-100'
      case 'markdown': return 'bg-neutral-800 text-neutral-200'
      default: return 'bg-neutral-600 text-neutral-100'
    }
  }

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl font-semibold text-neutral-100">
          Market Phase
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <motion.div 
          className={`text-xl md:text-3xl font-semibold text-center p-3 md:p-4 rounded-lg ${getPhaseStyle(data.phase)}`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {data.phase}
        </motion.div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm text-neutral-400">
            <span>Strength</span>
            <span>{(data.strength * 100).toFixed(1)}%</span>
          </div>
          <motion.div 
            className="h-2 bg-neutral-800 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              className="h-full bg-neutral-200"
              initial={{ width: 0 }}
              animate={{ width: `${data.strength * 100}%` }}
              transition={{ duration: 0.5, delay: 0.8 }}
            />
          </motion.div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          {Object.entries(data.keyLevels).map(([level, price], index) => (
            <motion.div 
              key={level} 
              className="bg-neutral-900/60 p-2 md:p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="text-[10px] md:text-xs text-neutral-500 mb-1">
                {level.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-sm md:text-base font-medium text-neutral-100 truncate">
                ${(price as number).toLocaleString()}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
