import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon,
  Star,
  StarOff,
  Trash2,
  Copy,
  Edit,
  ChevronRight,
  X,
  Dumbbell,
  Clock,
  TrendingUp,
  Share2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { 
  getWorkouts, 
  saveWorkout,
  deleteWorkout, 
  duplicateWorkout,
  calculateVolume,
  getTotalSets,
  getTotalReps
} from "@/lib/storage";

const WORKOUT_TYPES = ["All", "Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Core", "Custom"];

const History = () => {
  const navigate = useNavigate();
  const { id: selectedId } = useParams();
  
  const [workouts, setWorkouts] = useState([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState(null);

  useEffect(() => {
    loadWorkouts();
  }, []);

  useEffect(() => {
    if (selectedId) {
      const workout = workouts.find(w => w.id === selectedId);
      if (workout) setSelectedWorkout(workout);
    } else {
      setSelectedWorkout(null);
    }
  }, [selectedId, workouts]);

  useEffect(() => {
    filterWorkouts();
  }, [workouts, searchQuery, typeFilter, dateRange]);

  const loadWorkouts = () => {
    const data = getWorkouts().sort((a, b) => new Date(b.date) - new Date(a.date));
    setWorkouts(data);
    setFilteredWorkouts(data);
  };

  const filterWorkouts = () => {
    let filtered = [...workouts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(w => 
        w.title?.toLowerCase().includes(query) ||
        w.exercises?.some(e => e.name?.toLowerCase().includes(query)) ||
        w.notes?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (typeFilter !== "All") {
      filtered = filtered.filter(w => w.type === typeFilter);
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(w => {
        const workoutDate = parseISO(w.date);
        if (dateRange.from && dateRange.to) {
          return isWithinInterval(workoutDate, {
            start: startOfDay(dateRange.from),
            end: endOfDay(dateRange.to)
          });
        }
        if (dateRange.from) {
          return workoutDate >= startOfDay(dateRange.from);
        }
        if (dateRange.to) {
          return workoutDate <= endOfDay(dateRange.to);
        }
        return true;
      });
    }

    setFilteredWorkouts(filtered);
  };

  const toggleFavorite = (workout) => {
    const updated = { ...workout, isFavorite: !workout.isFavorite };
    saveWorkout(updated);
    loadWorkouts();
    toast.success(updated.isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const handleDuplicate = (workout) => {
    duplicateWorkout(workout.id);
    loadWorkouts();
    toast.success("Workout duplicated");
  };

  const confirmDelete = (workout) => {
    setWorkoutToDelete(workout);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (workoutToDelete) {
      deleteWorkout(workoutToDelete.id);
      loadWorkouts();
      if (selectedWorkout?.id === workoutToDelete.id) {
        setSelectedWorkout(null);
        navigate('/history');
      }
      toast.success("Workout deleted");
    }
    setDeleteDialogOpen(false);
    setWorkoutToDelete(null);
  };

  const shareWorkout = (workout) => {
    const text = generateWorkoutSummary(workout);
    navigator.clipboard.writeText(text);
    toast.success("Workout summary copied to clipboard");
  };

  const generateWorkoutSummary = (workout) => {
    const volume = calculateVolume(workout);
    const sets = getTotalSets(workout);
    const reps = getTotalReps(workout);
    
    let summary = `🏋️ ${workout.title}\n`;
    summary += `📅 ${format(parseISO(workout.date), 'MMMM d, yyyy')}\n`;
    summary += `⏱️ ${Math.floor(workout.duration / 60)}min\n\n`;
    
    workout.exercises?.forEach(ex => {
      summary += `${ex.name}\n`;
      ex.sets.forEach((set, i) => {
        summary += `  Set ${i + 1}: ${set.weight}kg × ${set.reps}\n`;
      });
    });
    
    summary += `\n📊 Total: ${sets} sets, ${reps} reps, ${volume}kg volume`;
    return summary;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setTypeFilter("All");
    setDateRange({ from: null, to: null });
  };

  const hasActiveFilters = searchQuery || typeFilter !== "All" || dateRange.from || dateRange.to;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="history-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            History
          </h1>
          <p className="text-zinc-500 mt-1">{filteredWorkouts.length} workouts</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass" data-testid="filters-card">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search workouts or exercises..."
                className="pl-10 bg-black/40 border-white/10"
                data-testid="search-input"
              />
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-black/40 border-white/10" data-testid="type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                {WORKOUT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="border-white/10 justify-start" data-testid="date-filter">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                    ) : format(dateRange.from, 'MMM d, yyyy')
                  ) : (
                    "Date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-zinc-900 border-white/10" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={1}
                  className="bg-zinc-900"
                />
              </PopoverContent>
            </Popover>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-zinc-400" data-testid="clear-filters">
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workouts List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-3">
          {filteredWorkouts.length === 0 ? (
            <Card className="glass" data-testid="no-workouts-card">
              <CardContent className="p-12 text-center">
                <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-500">No workouts found</p>
                <p className="text-xs text-zinc-600 mt-1">
                  {hasActiveFilters ? "Try adjusting your filters" : "Start logging workouts!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredWorkouts.map(workout => (
              <Card 
                key={workout.id} 
                className={`glass card-hover cursor-pointer transition-all ${
                  selectedWorkout?.id === workout.id ? 'border-cyan-500/50 ring-1 ring-cyan-500/20' : ''
                }`}
                onClick={() => navigate(`/history/${workout.id}`)}
                data-testid={`workout-card-${workout.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {workout.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                        <h3 className="font-medium text-white truncate">{workout.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {format(parseISO(workout.date), 'MMM d, yyyy')}
                        </span>
                        <Badge variant="outline" className="border-white/10 text-zinc-400">
                          {workout.type}
                        </Badge>
                        {workout.prs?.length > 0 && (
                          <Badge className="bg-neon-green/20 text-neon-green border-0">
                            {workout.prs.length} PR{workout.prs.length > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
                        <span>{workout.exercises?.length || 0} exercises</span>
                        <span>{getTotalSets(workout)} sets</span>
                        <span>{calculateVolume(workout).toLocaleString()}kg</span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-600 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        <div className="hidden lg:block">
          {selectedWorkout ? (
            <Card className="glass sticky top-8" data-testid="workout-detail">
              <CardHeader className="pb-2 border-b border-white/5">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-heading text-2xl uppercase text-white flex items-center gap-2">
                      {selectedWorkout.isFavorite && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
                      {selectedWorkout.title}
                    </CardTitle>
                    <p className="text-zinc-500 text-sm mt-1">
                      {format(parseISO(selectedWorkout.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                    {selectedWorkout.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-zinc-900/50">
                    <Clock className="w-5 h-5 mx-auto text-cyan-400 mb-1" />
                    <p className="font-mono text-lg text-white">{Math.floor(selectedWorkout.duration / 60)}m</p>
                    <p className="text-xs text-zinc-500">Duration</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-900/50">
                    <Dumbbell className="w-5 h-5 mx-auto text-neon-green mb-1" />
                    <p className="font-mono text-lg text-white">{getTotalSets(selectedWorkout)}</p>
                    <p className="text-xs text-zinc-500">Sets</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-zinc-900/50">
                    <TrendingUp className="w-5 h-5 mx-auto text-neon-purple mb-1" />
                    <p className="font-mono text-lg text-white">{(calculateVolume(selectedWorkout) / 1000).toFixed(1)}k</p>
                    <p className="text-xs text-zinc-500">Volume (kg)</p>
                  </div>
                </div>

                {/* PRs */}
                {selectedWorkout.prs?.length > 0 && (
                  <div className="p-3 rounded-lg bg-neon-green/5 border border-neon-green/20">
                    <p className="text-neon-green text-sm font-medium mb-2">🏆 Personal Records</p>
                    <div className="space-y-1">
                      {selectedWorkout.prs.map((pr, i) => (
                        <p key={i} className="text-xs text-zinc-300">
                          {pr.exercise}: {pr.value}{pr.type === 'weight' ? 'kg' : ' reps'} ({pr.type} PR)
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Exercises */}
                <div className="space-y-3">
                  <h4 className="font-heading text-sm uppercase text-zinc-400">Exercises</h4>
                  {selectedWorkout.exercises?.map((exercise, i) => (
                    <div key={i} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                      <p className="font-medium text-white mb-2">{exercise.name}</p>
                      <div className="space-y-1">
                        {exercise.sets.map((set, j) => (
                          <div key={j} className="flex items-center justify-between text-sm">
                            <span className="text-zinc-500">Set {j + 1}</span>
                            <span className="font-mono text-cyan-400">{set.weight}kg × {set.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {selectedWorkout.notes && (
                  <div className="p-3 rounded-lg bg-zinc-900/50 border border-white/5">
                    <p className="text-xs text-zinc-500 mb-1">Notes</p>
                    <p className="text-sm text-zinc-300">{selectedWorkout.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleFavorite(selectedWorkout)}
                    className="border-white/10"
                    data-testid="toggle-favorite-btn"
                  >
                    {selectedWorkout.isFavorite ? (
                      <StarOff className="w-4 h-4 mr-1" />
                    ) : (
                      <Star className="w-4 h-4 mr-1" />
                    )}
                    {selectedWorkout.isFavorite ? 'Unfavorite' : 'Favorite'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/log/${selectedWorkout.id}`)}
                    className="border-white/10"
                    data-testid="edit-workout-btn"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(selectedWorkout)}
                    className="border-white/10"
                    data-testid="duplicate-workout-btn"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Duplicate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => shareWorkout(selectedWorkout)}
                    className="border-white/10"
                    data-testid="share-workout-btn"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => confirmDelete(selectedWorkout)}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                    data-testid="delete-workout-btn"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="glass" data-testid="select-workout-prompt">
              <CardContent className="p-12 text-center">
                <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                <p className="text-zinc-500">Select a workout to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Workout?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete "{workoutToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default History;
