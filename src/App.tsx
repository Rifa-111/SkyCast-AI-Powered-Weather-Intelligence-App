import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, 
  MapPin, 
  Wind, 
  Droplets, 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Navigation,
  Loader2,
  Thermometer,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { getWeatherData, searchLocation, type WeatherData, getWeatherCondition } from './services/weatherService';

const WeatherIcon = ({ code, isDay, className }: { code: number; isDay: boolean; className?: string }) => {
  if (code === 0 || code === 1) return <Sun className={cn("text-yellow-400", className)} />;
  if (code === 2 || code === 3) return <Cloud className={cn("text-gray-400", className)} />;
  if (code >= 51 && code <= 67) return <CloudRain className={cn("text-blue-400", className)} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={cn("text-blue-100", className)} />;
  if (code >= 80 && code <= 82) return <CloudRain className={cn("text-blue-500", className)} />;
  if (code >= 95) return <CloudLightning className={cn("text-purple-400", className)} />;
  return <Cloud className={cn("text-gray-400", className)} />;
};

export default function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const fetchWeather = useCallback(async (lat: number, lon: number, name: string, country: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWeatherData(lat, lon, name, country);
      setWeather(data);
    } catch (err) {
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    try {
      setIsSearching(true);
      const results = await searchLocation(query);
      setSearchResults(results);
    } catch (err) {
      setError('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (loc: any) => {
    fetchWeather(loc.latitude, loc.longitude, loc.name, loc.country);
    setSearchResults([]);
    setQuery('');
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather(position.coords.latitude, position.coords.longitude, 'Current Location', '');
      },
      (err) => {
        setError('Unable to retrieve your location.');
        setLoading(false);
        // Fallback to a default location
        fetchWeather(51.5074, -0.1278, 'London', 'United Kingdom');
      }
    );
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const hourlyData = weather?.hourly.time.map((time, i) => ({
    time: format(parseISO(time), 'HH:mm'),
    temp: weather.hourly.temp[i],
  })) || [];

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100">
      {/* Header / Search */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-slate-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-200">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">SkyCast</h1>
          </div>

          <div className="relative w-full md:w-96">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <button 
                type="button"
                onClick={getCurrentLocation}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                title="Use current location"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
              </button>
            </form>

            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50"
                >
                  {searchResults.map((loc) => (
                    <button
                      key={`${loc.latitude}-${loc.longitude}`}
                      onClick={() => handleLocationSelect(loc)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center gap-3 transition-colors border-b border-slate-50 last:border-none"
                    >
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <div>
                        <div className="font-medium">{loc.name}</div>
                        <div className="text-xs text-slate-500">{loc.admin1}, {loc.country}</div>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl border border-red-100 flex items-center gap-3">
            <Loader2 className="w-4 h-4" />
            {error}
          </div>
        )}

        {weather && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <WeatherIcon code={weather.current.weatherCode} isDay={weather.current.isDay} className="w-48 h-48" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-slate-500 font-medium">
                    <MapPin className="w-4 h-4" />
                    {weather.location.name}, {weather.location.country}
                  </div>
                  <div className="text-sm text-slate-400">{format(new Date(), 'EEEE, d MMMM')}</div>
                </div>

                <div className="py-8">
                  <div className="text-8xl font-light tracking-tighter text-slate-900 flex items-start">
                    {Math.round(weather.current.temp)}
                    <span className="text-4xl mt-4 font-normal text-blue-500">°C</span>
                  </div>
                  <div className="text-xl font-medium text-slate-600 mt-2">
                    {weather.current.condition}
                  </div>
                </div>

                <div className="flex gap-6">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Wind className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">{weather.current.windSpeed} km/h</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Droplets className="w-5 h-5 text-blue-400" />
                    <span className="font-medium">{weather.current.humidity}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    <Thermometer className="w-5 h-5 text-blue-500" />
                    Temperature Trend
                  </h3>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Next 24 Hours</span>
                </div>
                
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                        interval={3}
                      />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '12px', 
                          border: 'none', 
                          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                        }}
                        itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="temp" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorTemp)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {hourlyData.filter((_, i) => i % 6 === 0).map((h, i) => (
                    <div key={i} className="text-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{h.time}</div>
                      <div className="font-bold text-slate-700">{Math.round(h.temp)}°</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* 7-Day Forecast */}
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  7-Day Forecast
                </h3>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                {weather.daily.time.map((day, i) => (
                  <motion.div 
                    key={day}
                    whileHover={{ y: -4 }}
                    className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 text-center space-y-3 transition-all hover:shadow-md"
                  >
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {i === 0 ? 'Today' : format(parseISO(day), 'EEE')}
                    </div>
                    <div className="flex justify-center">
                      <WeatherIcon code={weather.daily.weatherCode[i]} isDay={true} className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <div className="font-bold text-slate-800">{Math.round(weather.daily.maxTemp[i])}°</div>
                      <div className="text-xs text-slate-400">{Math.round(weather.daily.minTemp[i])}°</div>
                    </div>
                    <div className="text-[10px] font-medium text-slate-500 leading-tight">
                      {getWeatherCondition(weather.daily.weatherCode[i])}
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Additional Details */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-blue-600 p-6 rounded-[2rem] text-white space-y-4 shadow-xl shadow-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium opacity-80">Wind Speed</span>
                  <Wind className="w-5 h-5" />
                </div>
                <div className="text-3xl font-bold">{weather.current.windSpeed} km/h</div>
                <div className="text-xs opacity-70">Direction: NNE</div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Humidity</span>
                  <Droplets className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900">{weather.current.humidity}%</div>
                <div className="text-xs text-slate-400">Dew point: 12°C</div>
              </div>

              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-500">Visibility</span>
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-3xl font-bold text-slate-900">10 km</div>
                <div className="text-xs text-slate-400">Clear visibility</div>
              </div>
            </section>
          </motion.div>
        )}
      </main>

      <footer className="max-w-4xl mx-auto p-8 text-center text-slate-400 text-sm">
        <p>© 2024 SkyCast Weather. Data provided by Open-Meteo.</p>
      </footer>
    </div>
  );
}
