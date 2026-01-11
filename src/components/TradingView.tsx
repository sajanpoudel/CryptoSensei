import React, { useEffect, useRef } from 'react';
import { CryptoPrice } from '../services/types';

interface TradingViewProps {
  crypto: string;
  timeframe: string;
  price: CryptoPrice;
}

export const TradingView: React.FC<TradingViewProps> = ({ crypto, timeframe, price }) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Map timeframes to TradingView intervals
    const intervalMap: Record<string, string> = {
      '1H': '60',
      '4H': '240',
      '1D': 'D',
      '1W': 'W',
      '1M': 'M'
    };

    // Map crypto IDs to TradingView symbols
    const getSymbol = (cryptoId: string) => {
      const symbolMap: Record<string, string> = {
        'bitcoin': 'BTCUSDT',
        'ethereum': 'ETHUSDT',
        'binancecoin': 'BNBUSDT',
        'cardano': 'ADAUSDT',
        'solana': 'SOLUSDT',
        'polkadot': 'DOTUSDT',
        'injective-protocol': 'INJUSDT',
        'render-token': 'RENDERUSDT',
      };

      // Use mapped symbol if available, otherwise construct it
      const symbol = symbolMap[cryptoId] || 
        cryptoId.replace(/-/g, '').toUpperCase() + 'USDT';

      return `BINANCE:${symbol}`;
    };

    if (container.current) {
      try {
        // Clear previous content
        container.current.innerHTML = '';

        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'tradingview-widget-container relative w-full h-full';
        
        // Add price overlay
        if (price && typeof price.price !== 'undefined' && typeof price.change24h !== 'undefined') {
          const priceOverlay = document.createElement('div');
          priceOverlay.className = 'absolute top-4 right-4 bg-neutral-950/70 backdrop-blur-sm rounded-lg p-2 text-sm z-10 border border-neutral-800';
          priceOverlay.innerHTML = `
            <div class="flex items-center gap-2">
              <span class="text-neutral-100 font-medium">$${price.price.toLocaleString()}</span>
              <span class="text-neutral-400">
                ${price.change24h >= 0 ? '+' : ''}${price.change24h.toFixed(2)}%
              </span>
            </div>
          `;
          widgetContainer.appendChild(priceOverlay);
        }
        
        const widget = document.createElement('div');
        const widgetId = `tradingview_${crypto}_${Date.now()}`;
        widget.id = widgetId;
        widget.style.height = '100%';
        widget.style.width = '100%';
        widget.style.minHeight = '600px';
        
        widgetContainer.appendChild(widget);
        container.current.appendChild(widgetContainer);

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (typeof TradingView !== 'undefined' && widget.parentNode) {
            new (window as any).TradingView.widget({
              autosize: true,
              symbol: getSymbol(crypto),
              interval: intervalMap[timeframe] || 'D',
              container_id: widgetId,
              theme: 'dark',
              style: '1',
              locale: 'en',
              toolbar_bg: '#0f0f0f',
              enable_publishing: false,
              allow_symbol_change: true,
              save_image: false,
              hide_side_toolbar: false,
              withdateranges: true,
              hide_volume: false,
              studies: [
                'MASimple@tv-basicstudies',
                'RSI@tv-basicstudies',
                'MACD@tv-basicstudies'
              ],
              fullscreen: true,
              height: '100%',
              width: '100%'
            });
          }
        };

        document.head.appendChild(script);
      } catch (error) {
        console.error('Error initializing TradingView widget:', error);
        if (container.current) {
          container.current.innerHTML = `
            <div class="flex items-center justify-center h-full text-neutral-400">
              Error loading chart. Please try again later.
            </div>
          `;
        }
      }
    }

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [crypto, timeframe, price]);

  return (
    <div 
      ref={container} 
      className="w-full h-[600px] bg-neutral-950/50 rounded-lg overflow-hidden border border-neutral-800"
      style={{ minHeight: '600px' }}
    >
      <div className="flex items-center justify-center h-full text-neutral-400">
        Loading chart...
      </div>
    </div>
  );
};
