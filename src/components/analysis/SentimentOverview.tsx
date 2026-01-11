'use client'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const SentimentOverview = ({ data }: { data: any }) => {
  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-100">
          Market Sentiment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Sentiment */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-neutral-400">Overall Sentiment</span>
          <motion.div 
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              data.overall.signal === 'bullish' ? 'bg-white/10 text-neutral-100' :
              data.overall.signal === 'bearish' ? 'bg-neutral-800 text-neutral-200' :
              'bg-neutral-900 text-neutral-300'
            }`}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.5 }}
          >
            {data.overall.signal} ({data.overall.confidence}%)
          </motion.div>
        </motion.div>

        {/* Components */}
        <div className="space-y-4">
          {/* News Sentiment */}
          <motion.div 
            className="bg-neutral-900/60 p-4 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-neutral-400">News Sentiment</span>
              <span className="text-sm font-medium text-neutral-100">{data.components.news.score.toFixed(1)}%</span>
            </div>
            <div className="space-y-1">
              {data.components.news.recent.map((news: string, index: number) => (
                <motion.div 
                  key={index} 
                  className="text-xs text-neutral-500 truncate"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
                >
                  {news}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Social Sentiment */}
          <motion.div 
            className="bg-neutral-900/60 p-4 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Social Sentiment</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-100">{data.components.social.score.toFixed(1)}%</span>
                <span className="text-xs text-neutral-500">
                  Vol: {data.components.social.volume.toLocaleString()}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Market Sentiment */}
          <motion.div 
            className="bg-neutral-900/60 p-4 rounded-lg backdrop-blur-sm border border-neutral-800"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-neutral-400">Market Flow</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-100">{data.components.market.score.toFixed(1)}%</span>
                <span className="text-xs text-neutral-500">
                  Dom: {data.components.market.dominance.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
