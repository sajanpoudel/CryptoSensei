import React, { useState, useEffect, useRef } from 'react';
import { FeaturedCoin } from '../services/types';
import { Switch } from './ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from './ui/input'
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { featuredCoinsService } from '../services/featuredCoins';
import { api } from '../services/api';

interface CoinMetadata {
  price: number;
  marketCap: number;
}

interface FeaturedCoinsManagerProps {
  coins: FeaturedCoin[];
  onToggleCoin: (coinId: string) => void;
  onReorderCoins: (coins: FeaturedCoin[]) => void;
  onAddCoin: (coin: FeaturedCoin) => void;
  onRemoveCoin: (coinId: string) => void;
}

export const FeaturedCoinsManager: React.FC<FeaturedCoinsManagerProps> = ({
  coins,
  onToggleCoin,
  onReorderCoins,
  onAddCoin,
  onRemoveCoin
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [coinMetadata, setCoinMetadata] = useState<Record<string, CoinMetadata>>({});
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const activeCoinsCount = coins.filter(coin => coin.isActive).length;
  const MAX_ACTIVE_COINS = 5;

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const coinIds = coins.map(coin => coin.id);
        const batchData = await api.getBatchPrices(coinIds);
        
        const metadata: Record<string, CoinMetadata> = {};
        Object.entries(batchData).forEach(([id, data]) => {
          metadata[id] = {
            price: data.price,
            marketCap: data.marketCap || 0
          };
        });
        
        setCoinMetadata(metadata);
      } catch (error) {
        console.error('Error fetching coin metadata:', error);
      }
    };

    fetchMetadata();
    const interval = setInterval(fetchMetadata, 30000);

    return () => clearInterval(interval);
  }, [coins]);

  const handleToggle = (coinId: string) => {
    try {
      onToggleCoin(coinId);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchTerm('');
      setSearchResults([]);
    }
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await featuredCoinsService.searchCoins(value);
      const filteredResults = results.filter(
        result => !coins.some(coin => coin.id === result.id)
      ).slice(0, 10);
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching coins:', error);
    }
  };

  const handleAddCoin = (coin: any) => {
    onAddCoin(coin);
    setSearchTerm('');
    setSearchResults([]);
    setIsSearching(false);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(coins);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onReorderCoins(items);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <Card className="bg-neutral-950/50 backdrop-blur-lg border border-neutral-800">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <CardTitle className="text-xl font-semibold text-neutral-100">
          Featured Coins
        </CardTitle>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-sm text-neutral-400">
            {activeCoinsCount}/{MAX_ACTIVE_COINS} Active
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSearch}
            className="text-neutral-100 hover:text-neutral-300"
          >
            {isSearching ? 'Close' : 'Add'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2 bg-neutral-900 text-neutral-300 rounded-lg text-sm border border-neutral-800"
          >
            {error}
          </motion.div>
        )}

        {/* Search Bar */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4"
            >
              <div 
                ref={searchContainerRef}
                className="relative"
              >
                <Input
                  placeholder="Search coins..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-4 bg-neutral-900/60 border-neutral-800 text-neutral-100"
                  autoFocus
                />
                {searchResults.length > 0 && (
                  <div
                    className="absolute w-full mt-2 bg-neutral-950 rounded-lg shadow-lg z-10 max-h-[300px] overflow-y-auto border border-neutral-800"
                  >
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleAddCoin(result);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-neutral-900 text-sm text-neutral-200 flex items-center justify-between"
                      >
                        <span>{result.name} ({result.symbol})</span>
                        <span className="text-xs text-neutral-500">Add</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Coin List */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="featured-coins">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {coins.map((coin, index) => (
                  <Draggable key={coin.id} draggableId={coin.id} index={index}>
                    {(provided) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-neutral-900/60 p-3 rounded-lg backdrop-blur-sm border border-neutral-800"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2">
                          {/* Drag Handle */}
                          <div {...provided.dragHandleProps} className="px-2">
                            <span className="text-neutral-500 text-sm">⋮⋮</span>
                          </div>

                          {/* Coin Info */}
                          <div className="flex-1 px-2 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <span className="text-sm font-medium text-neutral-100 truncate">
                                {coin.name} ({coin.symbol})
                              </span>
                              {coinMetadata[coin.id] && (
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <span className="flex items-center whitespace-nowrap">
                                    ${coinMetadata[coin.id].price.toLocaleString()}
                                  </span>
                                  <span className="flex items-center whitespace-nowrap">
                                    ${coinMetadata[coin.id].marketCap.toLocaleString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2 ml-auto">
                            <Switch
                              checked={coin.isActive}
                              onCheckedChange={() => handleToggle(coin.id)}
                              disabled={!coin.isActive && activeCoinsCount >= MAX_ACTIVE_COINS}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onRemoveCoin(coin.id)}
                              className="text-neutral-400 hover:text-neutral-200"
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </CardContent>
    </Card>
  );
}; 
