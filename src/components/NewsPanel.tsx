import React from 'react';
import type { NewsItem } from '../services/types';

interface NewsPanelProps {
  crypto: string;
  news: NewsItem[];
}

export const NewsPanel: React.FC<NewsPanelProps> = ({ crypto, news }) => {
  // Remove duplicate news based on title
  const uniqueNews = news.filter((item, index, self) =>
    index === self.findIndex((t) => t.title === item.title)
  );

  // Filter news relevant to the selected crypto
  const filteredNews = uniqueNews.filter(item => {
    const searchTerms = [
      crypto,
      crypto.toUpperCase(),
      crypto.toLowerCase(),
      crypto === 'bitcoin' ? 'btc' : '',
      crypto === 'ethereum' ? 'eth' : '',
      crypto === 'binancecoin' ? 'bnb' : '',
    ].filter(Boolean);

    return searchTerms.some(term => 
      item.title.toLowerCase().includes(term) || 
      (item.description && item.description.toLowerCase().includes(term))
    );
  });

  // Take up to 10 news items
  const displayNews = filteredNews.slice(0, 10);

  // Function to truncate description
  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    if (words.length > 30) { // Limit to approximately 3-4 lines
      return words.slice(0, 30).join(' ') + '...';
    }
    return description;
  };

  return (
    <div className="space-y-4">
      {displayNews.length > 0 ? (
        displayNews.map((item, index) => (
          <a
            key={index}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-lg bg-neutral-900/60 hover:bg-neutral-900/80 transition-colors border border-neutral-800"
          >
            {/* Image Section */}
            {item.imageUrl && (
              <div className="mb-3 relative rounded-lg overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Content Section */}
            <div className="space-y-2">
              <h4 className="font-medium text-neutral-100">
                {item.title}
              </h4>
              
              {item.description && (
                <p className="text-sm text-neutral-300">
                  {truncateDescription(item.description)}
                </p>
              )}

              {/* Metadata Section */}
              <div className="flex items-center justify-between text-xs text-neutral-500 mt-2">
                <div className="flex items-center gap-2">
                  <span>{new Date(item.timestamp).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span>{item.source}</span>
                  {item.sentiment && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.sentiment === 'positive' ? 'bg-white/10 text-neutral-100' :
                      item.sentiment === 'negative' ? 'bg-neutral-800 text-neutral-200' :
                      'bg-neutral-900 text-neutral-300'
                    }`}>
                      {item.sentiment}
                    </span>
                  )}
                </div>
              </div>

              {/* AI Tags */}
              {item.aiTags && item.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {item.aiTags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 rounded-full bg-neutral-800 text-neutral-300 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </a>
        ))
      ) : (
        <div className="text-center text-neutral-400 py-8">
          <p>No news available for {crypto}</p>
          <p className="text-sm mt-2 text-neutral-500">Check back later for updates</p>
        </div>
      )}
    </div>
  );
};
