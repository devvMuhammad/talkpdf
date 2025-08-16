"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ExternalLink, 
  Calendar, 
  Building2, 
  AlertCircle,
  Newspaper,
  Clock
} from "lucide-react";

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage: string | null;
}

interface NewsData {
  articles: NewsArticle[];
  totalResults: number;
  error?: string;
}

interface NewsWidgetProps {
  data: NewsData;
}

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  } catch {
    return "Recently";
  }
};

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

export function NewsWidget({ data }: NewsWidgetProps) {
  if (data.error) {
    return (
      <Card className="w-full bg-red-950/50 border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium">News Error</p>
              <p className="text-red-300 text-sm">{data.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data.articles || data.articles.length === 0) {
    return (
      <Card className="w-full bg-gray-800/50 border-gray-700">
        <CardContent className="p-6 text-center">
          <Newspaper className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400">No news articles found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 text-gray-300 mb-4">
        <Newspaper className="w-5 h-5" />
        <span className="font-medium">
          Latest News ({data.totalResults} results)
        </span>
      </div>

      {/* Articles */}
      <div className="space-y-3">
        {data.articles.map((article, index) => (
          <Card 
            key={index} 
            className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex gap-4">
                {/* Article Image */}
                {article.urlToImage && (
                  <div className="flex-shrink-0 w-20 h-20 md:w-24 md:h-24">
                    <img
                      src={article.urlToImage}
                      alt={article.title}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {/* Article Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <h3 className="text-white font-semibold leading-snug mb-2 line-clamp-2">
                    {truncateText(article.title, 120)}
                  </h3>
                  
                  {/* Description */}
                  {article.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {truncateText(article.description, 150)}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      <span>{article.source}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(article.publishedAt)}</span>
                    </div>
                  </div>
                  
                  {/* Read More Link */}
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                  >
                    <span>Read more</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Show more indicator if there are more results */}
      {data.totalResults > data.articles.length && (
        <div className="text-center py-3">
          <p className="text-gray-500 text-sm">
            Showing {data.articles.length} of {data.totalResults} articles
          </p>
        </div>
      )}
    </div>
  );
}