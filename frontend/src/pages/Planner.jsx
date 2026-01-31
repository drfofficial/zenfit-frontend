import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Calendar as CalendarIcon,
  Plus,
  Dumbbell,
  X,
  ChevronLeft,
  ChevronRight,
  Play
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday
} from "date-fns";
import { 
  getPlanner, 
  savePlanner, 
  getPresets,
  getWorkouts,
  generateId
} from "@/lib/storage";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const WORKOUT_TYPES = [
  { value: "push", label: "Push", color: "bg-cyan-500/20 text-cyan-400" },
  { value: "pull", label: "Pull", color: "bg-neon-green/20 text-neon-green" },
  { value: "legs", label: "Legs", color: "bg-neon-purple/20 text-neon-purple" },
  { value: "upper", label: "Upper", color: "bg-blue-500/20 text-blue-400" },
  { value: "lower", label: "Lower", color: "bg-orange-500/20 text-orange-400" },
  { value: "cardio", label: "Cardio", color: "bg-pink-500/20 text-pink-400" },
  { value: "rest", label: "Rest Day", color: "bg-zinc-500/20 text-zinc-400" },
];

const Planner = () => {
  const navigate = useNavigate();
  const [planner, setPlanner] = useState({ weeklyPlan: {}, scheduledWorkouts: [] });
  const [presets, setPresets] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editDayOpen, setEditDayOpen] = useState(false);
  const [editingDay, setEditingDay] = useState(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ date: null, name: "", type: "", presetId: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPlanner(getPlanner());
    setPresets(getPresets());
    setWorkouts(getWorkouts());
  };

  const openDayEditor = (dayIndex) => {
    setEditingDay(dayIndex);
    setEditDayOpen(true);
  };

  const saveWeeklyPlan = (dayIndex, plan) => {
    const newPlanner = {
      ...planner,
      weeklyPlan: {
        ...planner.weeklyPlan,
        [dayIndex]: plan
      }
    };
    savePlanner(newPlanner);
    setPlanner(newPlanner);
    setEditDayOpen(false);
    toast.success(`${FULL_DAYS[dayIndex]} updated`);
  };

  const clearDayPlan = (dayIndex) => {
    const newPlanner = {
      ...planner,
      weeklyPlan: {
        ...planner.weeklyPlan,
        [dayIndex]: null
      }
    };
    savePlanner(newPlanner);
    setPlanner(newPlanner);
  };

  const addScheduledWorkout = () => {
    if (!newSchedule.date || !newSchedule.name) {
      toast.error("Please select a date and name");
      return;
    }

    const scheduled = {
      id: generateId(),
      date: format(newSchedule.date, 'yyyy-MM-dd'),
      name: newSchedule.name,
      type: newSchedule.type,
      presetId: newSchedule.presetId,
    };

    const newPlanner = {
      ...planner,
      scheduledWorkouts: [...planner.scheduledWorkouts, scheduled]
    };
    savePlanner(newPlanner);
    setPlanner(newPlanner);
    setScheduleDialogOpen(false);
    setNewSchedule({ date: null, name: "", type: "", presetId: "" });
    toast.success("Workout scheduled");
  };

  const removeScheduledWorkout = (id) => {
    const newPlanner = {
      ...planner,
      scheduledWorkouts: planner.scheduledWorkouts.filter(s => s.id !== id)
    };
    savePlanner(newPlanner);
    setPlanner(newPlanner);
    toast.success("Scheduled workout removed");
  };

  const getWorkoutTypeStyle = (type) => {
    const found = WORKOUT_TYPES.find(t => t.value === type?.toLowerCase());
    return found?.color || "bg-zinc-500/20 text-zinc-400";
  };

  // Get calendar data
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get workout/schedule for a specific date
  const getDateInfo = (date) => {
    const dayOfWeek = date.getDay();
    const weeklyPlan = planner.weeklyPlan?.[dayOfWeek];
    const scheduled = planner.scheduledWorkouts?.find(s => 
      isSameDay(parseISO(s.date), date)
    );
    const completed = workouts.find(w => 
      isSameDay(parseISO(w.date), date)
    );
    
    return { weeklyPlan, scheduled, completed };
  };

  const startWorkout = (plan, date) => {
    const url = plan?.presetId 
      ? `/log?preset=${plan.presetId}` 
      : '/log';
    navigate(url);
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="planner-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            Planner
          </h1>
          <p className="text-zinc-500 mt-1">Schedule your workouts</p>
        </div>
        <Button
          onClick={() => setScheduleDialogOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-bold uppercase btn-scale"
          data-testid="schedule-workout-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Schedule Workout
        </Button>
      </div>

      {/* Weekly Plan */}
      <Card className="glass" data-testid="weekly-plan-card">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase text-zinc-300">
            Weekly Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {DAYS_OF_WEEK.map((day, index) => {
              const plan = planner.weeklyPlan?.[index];
              const isCurrentDay = new Date().getDay() === index;
              
              return (
                <div
                  key={day}
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isCurrentDay 
                      ? 'border-cyan-500/50 bg-cyan-500/5' 
                      : 'border-white/5 bg-zinc-900/30 hover:border-white/10'
                  }`}
                  onClick={() => openDayEditor(index)}
                  data-testid={`day-plan-${index}`}
                >
                  <p className={`text-xs font-mono uppercase mb-2 ${isCurrentDay ? 'text-cyan-400' : 'text-zinc-500'}`}>
                    {day}
                  </p>
                  {plan ? (
                    <div className="space-y-1">
                      <Badge className={`${getWorkoutTypeStyle(plan.type)} text-xs`}>
                        {plan.type || plan.name}
                      </Badge>
                      {plan.name && plan.type !== plan.name && (
                        <p className="text-xs text-zinc-400 truncate">{plan.name}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-600">No plan</p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Calendar View */}
      <Card className="glass" data-testid="calendar-view-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-xl uppercase text-zinc-300">
              {format(currentMonth, 'MMMM yyyy')}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                data-testid="prev-month-btn"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(new Date())}
                data-testid="today-btn"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                data-testid="next-month-btn"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-xs text-zinc-500 font-mono uppercase py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month start */}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Days */}
            {daysInMonth.map(date => {
              const { weeklyPlan, scheduled, completed } = getDateInfo(date);
              const hasActivity = weeklyPlan || scheduled || completed;
              const today = isToday(date);
              
              return (
                <div
                  key={date.toISOString()}
                  className={`aspect-square p-1 rounded-lg border transition-all ${
                    today 
                      ? 'border-cyan-500/50 bg-cyan-500/5' 
                      : hasActivity 
                        ? 'border-white/10 bg-zinc-900/50' 
                        : 'border-transparent'
                  }`}
                  data-testid={`calendar-day-${format(date, 'yyyy-MM-dd')}`}
                >
                  <div className="h-full flex flex-col">
                    <span className={`text-xs font-mono ${today ? 'text-cyan-400' : 'text-zinc-400'}`}>
                      {format(date, 'd')}
                    </span>
                    <div className="flex-1 flex flex-col gap-0.5 mt-1 overflow-hidden">
                      {completed && (
                        <div className="w-full h-1 rounded-full bg-neon-green" title="Completed" />
                      )}
                      {(scheduled || weeklyPlan) && !completed && (
                        <div 
                          className={`w-full h-1 rounded-full ${
                            scheduled ? 'bg-cyan-400' : 'bg-zinc-500'
                          }`} 
                          title="Planned" 
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 rounded-full bg-neon-green" />
              <span className="text-xs text-zinc-500">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 rounded-full bg-cyan-400" />
              <span className="text-xs text-zinc-500">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 rounded-full bg-zinc-500" />
              <span className="text-xs text-zinc-500">Recurring Plan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Scheduled */}
      {planner.scheduledWorkouts?.length > 0 && (
        <Card className="glass" data-testid="scheduled-workouts-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl uppercase text-zinc-300">
              Scheduled Workouts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {planner.scheduledWorkouts
                .filter(s => parseISO(s.date) >= new Date())
                .sort((a, b) => parseISO(a.date) - parseISO(b.date))
                .map(scheduled => (
                  <div 
                    key={scheduled.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-zinc-900/50 border border-white/5"
                    data-testid={`scheduled-${scheduled.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <CalendarIcon className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{scheduled.name}</p>
                        <p className="text-xs text-zinc-500">
                          {format(parseISO(scheduled.date), 'EEEE, MMMM d')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isToday(parseISO(scheduled.date)) && (
                        <Button
                          size="sm"
                          onClick={() => startWorkout(scheduled)}
                          className="bg-cyan-500 text-black hover:bg-cyan-400"
                          data-testid={`start-scheduled-${scheduled.id}`}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduledWorkout(scheduled.id)}
                        className="text-zinc-400 hover:text-red-400"
                        data-testid={`remove-scheduled-${scheduled.id}`}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Day Dialog */}
      <Dialog open={editDayOpen} onOpenChange={setEditDayOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase">
              {editingDay !== null && FULL_DAYS[editingDay]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Workout Type</Label>
              <Select
                value={planner.weeklyPlan?.[editingDay]?.type || ""}
                onValueChange={(value) => {
                  const type = WORKOUT_TYPES.find(t => t.value === value);
                  saveWeeklyPlan(editingDay, { 
                    type: value, 
                    name: type?.label || value 
                  });
                }}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {WORKOUT_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className={type.color.replace('bg-', 'text-').split(' ')[1]}>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {presets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-zinc-400">Or link a preset</Label>
                <Select
                  value={planner.weeklyPlan?.[editingDay]?.presetId || ""}
                  onValueChange={(value) => {
                    const preset = presets.find(p => p.id === value);
                    if (preset) {
                      saveWeeklyPlan(editingDay, {
                        type: preset.type,
                        name: preset.name,
                        presetId: preset.id
                      });
                    }
                  }}
                >
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="Select preset" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {presets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {planner.weeklyPlan?.[editingDay] && (
              <Button
                variant="outline"
                onClick={() => {
                  clearDayPlan(editingDay);
                  setEditDayOpen(false);
                }}
                className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                Clear Day
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule New Workout Dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="glass border-white/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase">
              Schedule Workout
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Date</Label>
              <Calendar
                mode="single"
                selected={newSchedule.date}
                onSelect={(date) => setNewSchedule(prev => ({ ...prev, date }))}
                disabled={(date) => date < new Date()}
                className="bg-zinc-900/50 rounded-lg border border-white/5"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Name</Label>
              <Input
                value={newSchedule.name}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Heavy Leg Day"
                className="bg-black/40 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Type</Label>
              <Select
                value={newSchedule.type}
                onValueChange={(value) => setNewSchedule(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-black/40 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {WORKOUT_TYPES.filter(t => t.value !== 'rest').map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {presets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-zinc-400">Link Preset (optional)</Label>
                <Select
                  value={newSchedule.presetId}
                  onValueChange={(value) => setNewSchedule(prev => ({ ...prev, presetId: value }))}
                >
                  <SelectTrigger className="bg-black/40 border-white/10">
                    <SelectValue placeholder="No preset" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {presets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>{preset.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={addScheduledWorkout} className="bg-cyan-500 text-black hover:bg-cyan-400">
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Planner;
