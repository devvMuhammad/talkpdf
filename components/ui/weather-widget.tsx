"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  CloudSnow, 
  CloudDrizzle, 
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  feels_like: number;
  condition: string;
  description: string;
  humidity: number;
  wind_speed: number;
  icon: string;
  error?: string;
}

interface WeatherWidgetProps {
  data: WeatherData;
}

const getWeatherIcon = (condition: string, iconCode: string) => {
  const isNight = iconCode.includes('n');
  const iconClass = `w-12 h-12 ${isNight ? 'text-blue-300' : 'text-yellow-400'}`;
  
  switch (condition.toLowerCase()) {
    case 'clear':
      return <Sun className={iconClass} />;
    case 'clouds':
      return <Cloud className={`w-12 h-12 text-gray-400`} />;
    case 'rain':
      return <CloudRain className={`w-12 h-12 text-blue-400`} />;
    case 'drizzle':
      return <CloudDrizzle className={`w-12 h-12 text-blue-300`} />;
    case 'snow':
      return <CloudSnow className={`w-12 h-12 text-white`} />;
    case 'thunderstorm':
      return <CloudLightning className={`w-12 h-12 text-purple-400`} />;
    default:
      return <Cloud className={`w-12 h-12 text-gray-400`} />;
  }
};

const getTemperatureColor = (temp: number) => {
  if (temp <= 0) return 'text-blue-300';
  if (temp <= 10) return 'text-blue-200';
  if (temp <= 20) return 'text-green-300';
  if (temp <= 30) return 'text-yellow-300';
  return 'text-red-300';
};

const getBackgroundGradient = (condition: string, iconCode: string) => {
  const isNight = iconCode.includes('n');
  
  if (isNight) {
    return 'from-slate-800 to-slate-900';
  }
  
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'from-blue-400 to-blue-600';
    case 'clouds':
      return 'from-gray-400 to-gray-600';
    case 'rain':
    case 'drizzle':
      return 'from-blue-500 to-gray-600';
    case 'snow':
      return 'from-blue-200 to-blue-400';
    case 'thunderstorm':
      return 'from-purple-600 to-gray-800';
    default:
      return 'from-blue-400 to-blue-600';
  }
};

export function WeatherWidget({ data }: WeatherWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (data.error) {
    return (
      <Card className="max-w-md bg-red-950/50 border-red-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
            <div>
              <p className="text-red-200 font-medium">Weather Error</p>
              <p className="text-red-300 text-sm">{data.error}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const backgroundGradient = getBackgroundGradient(data.condition, data.icon);
  const tempColor = getTemperatureColor(data.temperature);

  return (
    <Card className={`w-full bg-gradient-to-br ${backgroundGradient} border-0 text-white shadow-xl`}>
      <CardContent className="p-6">
        {/* Main weather display */}
        <div className="text-center space-y-4">
          {/* Location */}
          <h3 className="text-xl font-semibold text-white/90">
            {data.location}
          </h3>
          
          {/* Weather icon and temperature */}
          <div className="flex items-center justify-center gap-4">
            {getWeatherIcon(data.condition, data.icon)}
            <div>
              <div className={`text-4xl font-bold ${tempColor}`}>
                {data.temperature}°C
              </div>
              <div className="text-white/70 text-sm">
                Feels like {data.feels_like}°C
              </div>
            </div>
          </div>
          
          {/* Weather condition */}
          <div>
            <p className="text-lg font-medium text-white/90 capitalize">
              {data.description}
            </p>
          </div>
          
          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 mx-auto px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            <span className="text-sm text-white/90">
              {isExpanded ? 'Less details' : 'More details'}
            </span>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-white/90" />
            ) : (
              <ChevronDown className="w-4 h-4 text-white/90" />
            )}
          </button>
        </div>
        
        {/* Expanded details */}
        {isExpanded && (
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Droplets className="w-5 h-5 text-blue-200" />
                <div>
                  <p className="text-xs text-white/70">Humidity</p>
                  <p className="text-white font-medium">{data.humidity}%</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/70">Wind Speed</p>
                  <p className="text-white font-medium">{data.wind_speed} m/s</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Thermometer className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/70">Condition</p>
                  <p className="text-white font-medium">{data.condition}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-white/80" />
                <div>
                  <p className="text-xs text-white/70">Icon Code</p>
                  <p className="text-white font-medium">{data.icon}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}