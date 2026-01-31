import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Dumbbell, 
  TrendingUp, 
  Target, 
  Flame, 
  Calendar,
  ChevronRight,
  Trophy,
  Zap,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  getWorkouts, 
  getWorkoutsThisWeek, 
  getSettings, 
  getPlanner,
  calculateStreak,
  calculateVolume,
  getAchievements
} from "@/lib/storage";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import { format, subDays, startOfDay, parseISO } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [workouts, setWorkouts] = useState([]);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState([]);
  const [settings, setSettings] = useState({ weeklyGoal: 3 });
  const [planner, setPlanner] = useState({ weeklyPlan: {} });
  const [streak, setStreak] = useState(0);
  const [chartData, setChartData] = useState([]);
  const [recentPRs, setRecentPRs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allWorkouts = getWorkouts();
    setWorkouts(allWorkouts);
    setWeeklyWorkouts(getWorkoutsThisWeek());
    setSettings(getSettings());
    setPlanner(getPlanner());
    setStreak(calculateStreak());
    
    // Generate chart data for last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      const dayWorkouts = allWorkouts.filter(w => 
        startOfDay(parseISO(w.date)).getTime() === startOfDay(date).getTime()
      );
      const volume = dayWorkouts.reduce((sum, w) => sum + calculateVolume(w), 0);
      return {
        date: format(date, 'EEE'),
        fullDate: format(date, 'MMM d'),
        workouts: dayWorkouts.length,
        volume: Math.round(volume),
      };
    });
    setChartData(last7Days);

    // Get recent PRs
    const workoutsWithPRs = allWorkouts
      .filter(w => w.prs && w.prs.length > 0)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 3);
    setRecentPRs(workoutsWithPRs.flatMap(w => w.prs.map(pr => ({ ...pr, date: w.date }))).slice(0, 5));
  };

  const weeklyProgress = (weeklyWorkouts.length / settings.weeklyGoal) * 100;
  const todayPlan = planner.weeklyPlan?.[new Date().getDay()];
  const totalVolume = workouts.reduce((sum, w) => sum + calculateVolume(w), 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass px-3 py-2 rounded-lg text-sm">
          <p className="text-zinc-400">{payload[0]?.payload?.fullDate}</p>
          <p className="text-cyan-400 font-mono">{payload[0]?.value?.toLocaleString()} {payload[0]?.name === 'volume' ? 'kg' : 'workouts'}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            Dashboard
          </h1>
          <p className="text-zinc-500 mt-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>
        <Button
          onClick={() => navigate(todayPlan?.presetId ? `/log?preset=${todayPlan.presetId}` : '/log')}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-bold uppercase tracking-wider btn-scale glow-cyan"
          data-testid="start-workout-btn"
        >
          <Dumbbell className="w-5 h-5 mr-2" />
          {todayPlan ? 'Start Planned Workout' : 'Start Workout'}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Goal */}
        <Card className="glass card-hover" data-testid="weekly-goal-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-5 h-5 text-cyan-400" />
              <span className="text-xs text-zinc-500 font-mono">THIS WEEK</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-baseline gap-1">
                <span className="font-heading font-black text-3xl text-white">
                  {weeklyWorkouts.length}
                </span>
                <span className="text-zinc-500 text-sm">/ {settings.weeklyGoal}</span>
              </div>
              <Progress value={Math.min(weeklyProgress, 100)} className="h-2 bg-zinc-800" />
              <p className="text-xs text-zinc-500">
                {settings.weeklyGoal - weeklyWorkouts.length > 0 
                  ? `${settings.weeklyGoal - weeklyWorkouts.length} more to goal`
                  : 'Goal reached! 🎯'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card className="glass card-hover" data-testid="streak-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Flame className="w-5 h-5 text-neon-orange" />
              <span className="text-xs text-zinc-500 font-mono">STREAK</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-black text-3xl text-white">
                {streak}
              </span>
              <span className="text-zinc-500 text-sm">weeks</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              {streak > 0 ? 'Keep it going!' : 'Start your streak'}
            </p>
          </CardContent>
        </Card>

        {/* Total Workouts */}
        <Card className="glass card-hover" data-testid="total-workouts-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <Dumbbell className="w-5 h-5 text-neon-green" />
              <span className="text-xs text-zinc-500 font-mono">TOTAL</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-black text-3xl text-white">
                {workouts.length}
              </span>
              <span className="text-zinc-500 text-sm">workouts</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">All time</p>
          </CardContent>
        </Card>

        {/* Total Volume */}
        <Card className="glass card-hover" data-testid="total-volume-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-5 h-5 text-neon-purple" />
              <span className="text-xs text-zinc-500 font-mono">VOLUME</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-heading font-black text-3xl text-white">
                {(totalVolume / 1000).toFixed(1)}
              </span>
              <span className="text-zinc-500 text-sm">tons</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Total lifted</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Volume Chart */}
        <Card className="glass card-hover" data-testid="volume-chart-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase text-zinc-300 flex items-center justify-between">
              <span>Weekly Volume</span>
              <Link to="/progress" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                Details <ChevronRight className="w-4 h-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="volume" 
                    stroke="#00f0ff" 
                    strokeWidth={2}
                    dot={{ fill: '#00f0ff', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: '#00f0ff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workouts Chart */}
        <Card className="glass card-hover" data-testid="workouts-chart-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase text-zinc-300 flex items-center justify-between">
              <span>Weekly Activity</span>
              <Link to="/history" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                History <ChevronRight className="w-4 h-4" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
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
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="workouts" 
                    fill="#00ff9d" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Today's Plan */}
        <Card className="glass card-hover" data-testid="todays-plan-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase text-zinc-300 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              Today's Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayPlan ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{todayPlan.name}</p>
                    <p className="text-xs text-zinc-500">{todayPlan.type}</p>
                  </div>
                </div>
                <Button
                  onClick={() => navigate(todayPlan.presetId ? `/log?preset=${todayPlan.presetId}` : '/log')}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white"
                  data-testid="start-planned-btn"
                >
                  Start Now
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-500 text-sm mb-3">No workout planned for today</p>
                <Link to="/planner">
                  <Button variant="outline" size="sm" className="border-white/10" data-testid="plan-workout-btn">
                    Plan Workout
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent PRs */}
        <Card className="glass card-hover" data-testid="recent-prs-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase text-zinc-300 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-neon-orange" />
              Recent PRs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentPRs.length > 0 ? (
              <div className="space-y-2">
                {recentPRs.slice(0, 3).map((pr, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <div>
                      <p className="text-sm text-white">{pr.exercise}</p>
                      <p className="text-xs text-zinc-500">{pr.type === 'weight' ? 'Weight PR' : 'Rep PR'}</p>
                    </div>
                    <span className="font-mono text-neon-green text-sm">
                      {pr.value}{pr.type === 'weight' ? 'kg' : ' reps'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-zinc-500 text-sm">No PRs yet</p>
                <p className="text-xs text-zinc-600 mt-1">Keep training to set records!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass card-hover" data-testid="quick-actions-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg uppercase text-zinc-300 flex items-center gap-2">
              <Zap className="w-5 h-5 text-cyan-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/log" className="block">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5" data-testid="quick-new-workout">
                <Dumbbell className="w-4 h-4 mr-2" />
                New Workout
              </Button>
            </Link>
            <Link to="/presets" className="block">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5" data-testid="quick-presets">
                <BookTemplate className="w-4 h-4 mr-2" />
                View Presets
              </Button>
            </Link>
            <Link to="/achievements" className="block">
              <Button variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5" data-testid="quick-achievements">
                <Trophy className="w-4 h-4 mr-2" />
                Achievements
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Add missing import
import { BookTemplate } from "lucide-react";

export default Dashboard;
