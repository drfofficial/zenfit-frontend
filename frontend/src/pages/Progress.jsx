import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Dumbbell,
  Target,
  Flame,
  Trophy
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";
import { format, subDays, subMonths, startOfDay, parseISO, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { 
  getWorkouts, 
  calculateVolume,
  getTotalSets,
  getTotalReps,
  getSettings
} from "@/lib/storage";

const TIME_RANGES = [
  { value: '7', label: '7 Days' },
  { value: '30', label: '30 Days' },
  { value: '90', label: '90 Days' },
  { value: '365', label: '12 Months' },
];

const METRICS = [
  { value: 'volume', label: 'Total Volume', unit: 'kg' },
  { value: 'workouts', label: 'Workouts', unit: '' },
  { value: 'sets', label: 'Total Sets', unit: '' },
  { value: 'reps', label: 'Total Reps', unit: '' },
];

const Progress = () => {
  const [workouts, setWorkouts] = useState([]);
  const [timeRange, setTimeRange] = useState('30');
  const [metric, setMetric] = useState('volume');
  const [chartData, setChartData] = useState([]);
  const [exerciseData, setExerciseData] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('all');
  const [stats, setStats] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (workouts.length > 0) {
      generateChartData();
      calculateStats();
    }
  }, [workouts, timeRange, metric, selectedExercise]);

  const loadData = () => {
    const data = getWorkouts().sort((a, b) => new Date(a.date) - new Date(b.date));
    setWorkouts(data);
    
    // Get unique exercises
    const exercises = new Set();
    data.forEach(w => {
      w.exercises?.forEach(e => exercises.add(e.name));
    });
    setExerciseData(Array.from(exercises).sort());
  };

  const generateChartData = () => {
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    const endDate = new Date();
    
    const filteredWorkouts = workouts.filter(w => {
      const date = parseISO(w.date);
      return date >= startDate && date <= endDate;
    });

    let data = [];
    
    if (days <= 30) {
      // Daily data
      const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
      data = dateRange.map(date => {
        const dayWorkouts = filteredWorkouts.filter(w => 
          startOfDay(parseISO(w.date)).getTime() === startOfDay(date).getTime()
        );
        
        // Filter by exercise if selected
        let relevantWorkouts = dayWorkouts;
        if (selectedExercise !== 'all') {
          relevantWorkouts = dayWorkouts.map(w => ({
            ...w,
            exercises: w.exercises?.filter(e => e.name === selectedExercise) || []
          })).filter(w => w.exercises.length > 0);
        }

        return {
          date: format(date, 'MMM d'),
          fullDate: format(date, 'MMM d, yyyy'),
          volume: relevantWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0),
          workouts: relevantWorkouts.length,
          sets: relevantWorkouts.reduce((sum, w) => sum + getTotalSets(w), 0),
          reps: relevantWorkouts.reduce((sum, w) => sum + getTotalReps(w), 0),
        };
      });
    } else {
      // Weekly data for longer periods
      const weeks = eachWeekOfInterval({ start: startDate, end: endDate });
      data = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart);
        const weekWorkouts = filteredWorkouts.filter(w => {
          const date = parseISO(w.date);
          return date >= weekStart && date <= weekEnd;
        });

        let relevantWorkouts = weekWorkouts;
        if (selectedExercise !== 'all') {
          relevantWorkouts = weekWorkouts.map(w => ({
            ...w,
            exercises: w.exercises?.filter(e => e.name === selectedExercise) || []
          })).filter(w => w.exercises.length > 0);
        }

        return {
          date: format(weekStart, 'MMM d'),
          fullDate: `Week of ${format(weekStart, 'MMM d')}`,
          volume: relevantWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0),
          workouts: relevantWorkouts.length,
          sets: relevantWorkouts.reduce((sum, w) => sum + getTotalSets(w), 0),
          reps: relevantWorkouts.reduce((sum, w) => sum + getTotalReps(w), 0),
        };
      });
    }

    setChartData(data);
  };

  const calculateStats = () => {
    const days = parseInt(timeRange);
    const startDate = subDays(new Date(), days);
    const prevStartDate = subDays(startDate, days);
    
    const currentPeriod = workouts.filter(w => parseISO(w.date) >= startDate);
    const prevPeriod = workouts.filter(w => {
      const date = parseISO(w.date);
      return date >= prevStartDate && date < startDate;
    });

    const currentVolume = currentPeriod.reduce((sum, w) => sum + calculateVolume(w), 0);
    const prevVolume = prevPeriod.reduce((sum, w) => sum + calculateVolume(w), 0);
    const volumeChange = prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume * 100) : 0;

    const currentWorkouts = currentPeriod.length;
    const prevWorkouts = prevPeriod.length;
    const workoutsChange = prevWorkouts > 0 ? ((currentWorkouts - prevWorkouts) / prevWorkouts * 100) : 0;

    const avgVolume = currentWorkouts > 0 ? currentVolume / currentWorkouts : 0;
    const prevAvgVolume = prevWorkouts > 0 ? prevVolume / prevWorkouts : 0;
    const avgChange = prevAvgVolume > 0 ? ((avgVolume - prevAvgVolume) / prevAvgVolume * 100) : 0;

    setStats({
      totalVolume: currentVolume,
      volumeChange,
      totalWorkouts: currentWorkouts,
      workoutsChange,
      avgVolume,
      avgChange,
      totalSets: currentPeriod.reduce((sum, w) => sum + getTotalSets(w), 0),
      totalReps: currentPeriod.reduce((sum, w) => sum + getTotalReps(w), 0),
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const metricInfo = METRICS.find(m => m.value === metric);
      return (
        <div className="glass px-4 py-3 rounded-lg">
          <p className="text-zinc-400 text-sm">{payload[0]?.payload?.fullDate}</p>
          <p className="text-cyan-400 font-mono text-lg">
            {payload[0]?.value?.toLocaleString()} {metricInfo?.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  const StatChange = ({ value }) => {
    if (value === 0) return <span className="text-zinc-500">—</span>;
    const isPositive = value > 0;
    return (
      <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="progress-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            Progress
          </h1>
          <p className="text-zinc-500 mt-1">Track your fitness journey</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-black/40 border-white/10" data-testid="time-range-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              {TIME_RANGES.map(range => (
                <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass card-hover" data-testid="stat-volume">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <StatChange value={stats.volumeChange} />
            </div>
            <p className="font-heading font-black text-2xl text-white">
              {((stats.totalVolume || 0) / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-zinc-500">Total Volume (kg)</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover" data-testid="stat-workouts">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Dumbbell className="w-5 h-5 text-neon-green" />
              <StatChange value={stats.workoutsChange} />
            </div>
            <p className="font-heading font-black text-2xl text-white">
              {stats.totalWorkouts || 0}
            </p>
            <p className="text-xs text-zinc-500">Workouts</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover" data-testid="stat-avg-volume">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-neon-purple" />
              <StatChange value={stats.avgChange} />
            </div>
            <p className="font-heading font-black text-2xl text-white">
              {((stats.avgVolume || 0) / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-zinc-500">Avg Volume/Workout</p>
          </CardContent>
        </Card>

        <Card className="glass card-hover" data-testid="stat-sets">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <p className="font-heading font-black text-2xl text-white">
              {stats.totalSets || 0}
            </p>
            <p className="text-xs text-zinc-500">Total Sets</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Chart */}
      <Card className="glass" data-testid="main-chart-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="font-heading text-xl uppercase text-zinc-300">
              {METRICS.find(m => m.value === metric)?.label} Trend
            </CardTitle>
            <div className="flex gap-2">
              <Select value={metric} onValueChange={setMetric}>
                <SelectTrigger className="w-40 bg-black/40 border-white/10" data-testid="metric-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {METRICS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {exerciseData.length > 0 && (
                <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                  <SelectTrigger className="w-48 bg-black/40 border-white/10" data-testid="exercise-filter">
                    <SelectValue placeholder="All exercises" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                    <SelectItem value="all">All Exercises</SelectItem>
                    {exerciseData.map(ex => (
                      <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    stroke="#52525b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#52525b" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => metric === 'volume' ? `${(v/1000).toFixed(0)}k` : v}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={metric}
                    stroke="#00f0ff" 
                    strokeWidth={2}
                    fill="url(#colorMetric)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500">No data available for this period</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Exercise Progress Cards */}
      {exerciseData.length > 0 && (
        <div>
          <h2 className="font-heading font-bold text-xl uppercase text-zinc-300 mb-4">
            Top Exercises
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {exerciseData.slice(0, 6).map(exercise => {
              const exerciseWorkouts = workouts.filter(w => 
                w.exercises?.some(e => e.name === exercise)
              );
              const maxWeight = Math.max(0, ...exerciseWorkouts
                .flatMap(w => w.exercises?.filter(e => e.name === exercise) || [])
                .flatMap(e => e.sets?.map(s => s.weight) || [])
              );
              const totalVolume = exerciseWorkouts.reduce((sum, w) => {
                const ex = w.exercises?.find(e => e.name === exercise);
                if (!ex) return sum;
                return sum + ex.sets.reduce((setSum, s) => setSum + (s.reps * s.weight), 0);
              }, 0);

              return (
                <Card key={exercise} className="glass card-hover" data-testid={`exercise-progress-${exercise}`}>
                  <CardContent className="p-4">
                    <h3 className="font-medium text-white mb-3">{exercise}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Max Weight</p>
                        <p className="font-mono text-cyan-400">{maxWeight}kg</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 mb-1">Total Volume</p>
                        <p className="font-mono text-neon-green">{(totalVolume / 1000).toFixed(1)}k</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
