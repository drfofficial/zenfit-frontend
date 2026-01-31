import { useState, useEffect } from "react";
import { 
  Trophy, 
  Star,
  Flame,
  Dumbbell,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  getWorkouts, 
  getAchievements, 
  unlockAchievement,
  saveAchievements,
  calculateVolume,
  calculateStreak,
  getWorkoutsThisWeek,
  getSettings
} from "@/lib/storage";

const ACHIEVEMENTS = [
  // Workout milestones
  { id: 'first_workout', name: 'First Step', description: 'Complete your first workout', icon: Dumbbell, color: 'text-cyan-400', requirement: (stats) => stats.totalWorkouts >= 1 },
  { id: 'workouts_10', name: 'Getting Started', description: 'Complete 10 workouts', icon: Dumbbell, color: 'text-cyan-400', requirement: (stats) => stats.totalWorkouts >= 10 },
  { id: 'workouts_25', name: 'Committed', description: 'Complete 25 workouts', icon: Dumbbell, color: 'text-neon-green', requirement: (stats) => stats.totalWorkouts >= 25 },
  { id: 'workouts_50', name: 'Dedicated', description: 'Complete 50 workouts', icon: Dumbbell, color: 'text-neon-green', requirement: (stats) => stats.totalWorkouts >= 50 },
  { id: 'workouts_100', name: 'Century', description: 'Complete 100 workouts', icon: Trophy, color: 'text-yellow-500', requirement: (stats) => stats.totalWorkouts >= 100 },
  
  // Streak achievements
  { id: 'streak_2', name: 'Consistency', description: '2 week goal streak', icon: Flame, color: 'text-orange-400', requirement: (stats) => stats.currentStreak >= 2 },
  { id: 'streak_4', name: 'On Fire', description: '4 week goal streak', icon: Flame, color: 'text-orange-400', requirement: (stats) => stats.currentStreak >= 4 },
  { id: 'streak_8', name: 'Unstoppable', description: '8 week goal streak', icon: Flame, color: 'text-red-500', requirement: (stats) => stats.currentStreak >= 8 },
  { id: 'streak_12', name: 'Iron Will', description: '12 week goal streak', icon: Crown, color: 'text-yellow-500', requirement: (stats) => stats.currentStreak >= 12 },
  
  // Volume achievements
  { id: 'volume_10k', name: 'Heavy Lifter', description: 'Lift 10,000 kg total', icon: TrendingUp, color: 'text-purple-400', requirement: (stats) => stats.totalVolume >= 10000 },
  { id: 'volume_50k', name: 'Powerhouse', description: 'Lift 50,000 kg total', icon: TrendingUp, color: 'text-purple-400', requirement: (stats) => stats.totalVolume >= 50000 },
  { id: 'volume_100k', name: 'Titan', description: 'Lift 100,000 kg total', icon: TrendingUp, color: 'text-purple-500', requirement: (stats) => stats.totalVolume >= 100000 },
  { id: 'volume_500k', name: 'Legend', description: 'Lift 500,000 kg total', icon: Crown, color: 'text-yellow-500', requirement: (stats) => stats.totalVolume >= 500000 },
  
  // Weekly goal achievements
  { id: 'weekly_goal_1', name: 'Goal Setter', description: 'Hit your weekly goal', icon: Target, color: 'text-cyan-400', requirement: (stats) => stats.weeksGoalMet >= 1 },
  { id: 'weekly_goal_4', name: 'Goal Crusher', description: 'Hit weekly goal 4 times', icon: Target, color: 'text-neon-green', requirement: (stats) => stats.weeksGoalMet >= 4 },
  { id: 'weekly_goal_12', name: 'Goal Master', description: 'Hit weekly goal 12 times', icon: Award, color: 'text-yellow-500', requirement: (stats) => stats.weeksGoalMet >= 12 },
  
  // PR achievements
  { id: 'first_pr', name: 'Personal Best', description: 'Set your first PR', icon: Star, color: 'text-yellow-400', requirement: (stats) => stats.totalPRs >= 1 },
  { id: 'prs_10', name: 'Record Breaker', description: 'Set 10 PRs', icon: Star, color: 'text-yellow-400', requirement: (stats) => stats.totalPRs >= 10 },
  { id: 'prs_25', name: 'PR Machine', description: 'Set 25 PRs', icon: Medal, color: 'text-yellow-500', requirement: (stats) => stats.totalPRs >= 25 },
  
  // Special achievements
  { id: 'variety', name: 'Variety', description: 'Log 5 different exercises', icon: Zap, color: 'text-cyan-400', requirement: (stats) => stats.uniqueExercises >= 5 },
  { id: 'diverse', name: 'Diverse Training', description: 'Log 10 different exercises', icon: Zap, color: 'text-neon-green', requirement: (stats) => stats.uniqueExercises >= 10 },
];

const Achievements = () => {
  const [achievements, setAchievements] = useState({ unlocked: [], stats: {} });
  const [stats, setStats] = useState({});
  const [recentUnlocks, setRecentUnlocks] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    checkAchievements();
  }, [stats]);

  const loadData = () => {
    const workouts = getWorkouts();
    const settings = getSettings();
    const weeklyWorkouts = getWorkoutsThisWeek();
    
    // Calculate stats
    const totalWorkouts = workouts.length;
    const totalVolume = workouts.reduce((sum, w) => sum + calculateVolume(w), 0);
    const currentStreak = calculateStreak();
    const totalPRs = workouts.reduce((sum, w) => sum + (w.prs?.length || 0), 0);
    
    // Unique exercises
    const uniqueExercises = new Set();
    workouts.forEach(w => {
      w.exercises?.forEach(e => uniqueExercises.add(e.name));
    });

    // Calculate weeks goal met
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(a.date) - new Date(b.date));
    let weeksGoalMet = 0;
    if (sortedWorkouts.length > 0) {
      const firstDate = new Date(sortedWorkouts[0].date);
      const now = new Date();
      let checkDate = new Date(firstDate);
      
      while (checkDate <= now) {
        const weekStart = new Date(checkDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekWorkouts = sortedWorkouts.filter(w => {
          const d = new Date(w.date);
          return d >= weekStart && d <= weekEnd;
        });
        
        if (weekWorkouts.length >= settings.weeklyGoal) {
          weeksGoalMet++;
        }
        
        checkDate.setDate(checkDate.getDate() + 7);
      }
    }

    const calculatedStats = {
      totalWorkouts,
      totalVolume,
      currentStreak,
      totalPRs,
      uniqueExercises: uniqueExercises.size,
      weeksGoalMet,
      weeklyWorkouts: weeklyWorkouts.length,
      weeklyGoal: settings.weeklyGoal,
    };

    setStats(calculatedStats);
    setAchievements(getAchievements());
  };

  const checkAchievements = () => {
    const currentAchievements = getAchievements();
    const newUnlocks = [];

    ACHIEVEMENTS.forEach(achievement => {
      if (!currentAchievements.unlocked.includes(achievement.id)) {
        if (achievement.requirement(stats)) {
          unlockAchievement(achievement.id);
          newUnlocks.push(achievement);
        }
      }
    });

    if (newUnlocks.length > 0) {
      setRecentUnlocks(newUnlocks);
      setAchievements(getAchievements());
    }
  };

  const unlockedCount = achievements.unlocked?.length || 0;
  const totalCount = ACHIEVEMENTS.length;
  const progressPercent = (unlockedCount / totalCount) * 100;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="achievements-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            Achievements
          </h1>
          <p className="text-zinc-500 mt-1">{unlockedCount} of {totalCount} unlocked</p>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="glass" data-testid="achievements-progress">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-neon-green/20 flex items-center justify-center">
              <Trophy className="w-8 h-8 text-cyan-400" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading text-2xl font-bold text-white">{progressPercent.toFixed(0)}% Complete</h2>
              <p className="text-zinc-500 text-sm">{totalCount - unlockedCount} achievements remaining</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-3 bg-zinc-800" />
        </CardContent>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="glass" data-testid="stat-total-workouts">
          <CardContent className="p-4 text-center">
            <Dumbbell className="w-6 h-6 mx-auto text-cyan-400 mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{stats.totalWorkouts || 0}</p>
            <p className="text-xs text-zinc-500">Workouts</p>
          </CardContent>
        </Card>
        <Card className="glass" data-testid="stat-streak">
          <CardContent className="p-4 text-center">
            <Flame className="w-6 h-6 mx-auto text-orange-400 mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{stats.currentStreak || 0}</p>
            <p className="text-xs text-zinc-500">Week Streak</p>
          </CardContent>
        </Card>
        <Card className="glass" data-testid="stat-total-volume">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 mx-auto text-neon-green mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{((stats.totalVolume || 0) / 1000).toFixed(0)}k</p>
            <p className="text-xs text-zinc-500">Volume (kg)</p>
          </CardContent>
        </Card>
        <Card className="glass" data-testid="stat-prs">
          <CardContent className="p-4 text-center">
            <Star className="w-6 h-6 mx-auto text-yellow-400 mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{stats.totalPRs || 0}</p>
            <p className="text-xs text-zinc-500">PRs Set</p>
          </CardContent>
        </Card>
        <Card className="glass" data-testid="stat-goals">
          <CardContent className="p-4 text-center">
            <Target className="w-6 h-6 mx-auto text-purple-400 mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{stats.weeksGoalMet || 0}</p>
            <p className="text-xs text-zinc-500">Goals Met</p>
          </CardContent>
        </Card>
        <Card className="glass" data-testid="stat-exercises">
          <CardContent className="p-4 text-center">
            <Zap className="w-6 h-6 mx-auto text-cyan-400 mb-2" />
            <p className="font-heading font-bold text-2xl text-white">{stats.uniqueExercises || 0}</p>
            <p className="text-xs text-zinc-500">Exercises</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievements Grid */}
      <div>
        <h2 className="font-heading font-bold text-xl uppercase text-zinc-300 mb-4">
          All Achievements
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = achievements.unlocked?.includes(achievement.id);
            const Icon = achievement.icon;
            const unlockedAt = achievements.unlockedAt?.[achievement.id];
            
            return (
              <Card 
                key={achievement.id} 
                className={`glass transition-all ${
                  isUnlocked 
                    ? 'card-hover border-white/10' 
                    : 'opacity-50 grayscale'
                }`}
                data-testid={`achievement-${achievement.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isUnlocked 
                        ? 'bg-gradient-to-br from-zinc-800 to-zinc-900' 
                        : 'bg-zinc-900'
                    }`}>
                      <Icon className={`w-6 h-6 ${isUnlocked ? achievement.color : 'text-zinc-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-medium truncate ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                          {achievement.name}
                        </h3>
                        {isUnlocked && (
                          <Badge className="bg-neon-green/20 text-neon-green border-0 text-xs flex-shrink-0">
                            Unlocked
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{achievement.description}</p>
                      {isUnlocked && unlockedAt && (
                        <p className="text-xs text-zinc-600 mt-1">
                          {new Date(unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Achievements;
