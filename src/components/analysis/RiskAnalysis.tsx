'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RiskAnalysisProps {
  data: {
    overall: number
    factors: Record<string, number>
    warnings: string[]
  }
}

export const RiskAnalysis: React.FC<RiskAnalysisProps> = ({ data }) => {
  const getRiskColor = (risk: number) => {
    if (risk > 70) return 'bg-white text-black'
    if (risk > 50) return 'bg-neutral-700 text-neutral-100'
    return 'bg-neutral-800 text-neutral-200'
  }

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-100">
          Risk Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-neutral-400">Overall Risk</span>
          <motion.div 
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${getRiskColor(data.overall)}`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          >
            {data.overall.toFixed(1)}%
          </motion.div>
        </motion.div>

        {/* Risk Factors */}
        <div className="space-y-3">
          {Object.entries(data.factors).map(([factor, value], index) => (
            <motion.div 
              key={factor} 
              className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-neutral-400">
                  {factor.charAt(0).toUpperCase() + factor.slice(1)} Risk
                </span>
                <span className="text-sm font-medium text-neutral-100">
                  {value.toFixed(1)}%
                </span>
              </div>
              <motion.div 
                className="h-1.5 bg-neutral-800 rounded-full overflow-hidden"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
              >
                <motion.div 
                  className="h-full bg-neutral-200"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Risk Warnings */}
        {data.warnings.length > 0 && (
          <motion.div 
            className="space-y-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h4 className="text-sm text-neutral-400">Risk Warnings</h4>
            <div className="space-y-1">
              {data.warnings.map((warning, index) => (
                <motion.div 
                  key={index} 
                  className="flex items-center gap-2 text-xs text-neutral-300"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-neutral-500" />
                  <span>{warning}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}
