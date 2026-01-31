import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Trash2, 
  Save, 
  Clock, 
  Dumbbell,
  ChevronDown,
  ChevronUp,
  X,
  Trophy,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  getWorkouts, 
  saveWorkout, 
  getPresets, 
  detectPRs,
  getDraft,
  saveDraft,
  clearDraft,
  generateId,
  getToday
} from "@/lib/storage";

const WORKOUT_TYPES = [
  "Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Core", "Custom"
];

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull-ups", "Dips", "Lunges", "Leg Press", "Lat Pulldown",
  "Bicep Curls", "Tricep Extensions", "Leg Curls", "Leg Extensions",
  "Calf Raises", "Plank", "Romanian Deadlift", "Face Pulls"
];

const WorkoutLogger = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const presetId = searchParams.get('preset');

  const [workout, setWorkout] = useState({
    id: null,
    title: "",
    date: getToday(),
    type: "Custom",
    duration: 0,
    notes: "",
    exercises: [],
    isFavorite: false,
    prs: [],
  });
  
  const [presets, setPresets] = useState([]);
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState(null);
  const [detectedPRs, setDetectedPRs] = useState([]);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  useEffect(() => {
    setPresets(getPresets());
    
    // Check for draft
    const draft = getDraft();
    if (draft && !id && !presetId) {
      setShowDraftRestore(true);
    }
    
    // Load existing workout if editing
    if (id) {
      const workouts = getWorkouts();
      const existing = workouts.find(w => w.id === id);
      if (existing) {
        setWorkout(existing);
      }
    }
    
    // Apply preset if specified
    if (presetId) {
      const preset = getPresets().find(p => p.id === presetId);
      if (preset) {
        applyPreset(preset);
      }
    }
  }, [id, presetId]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((new Date() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  // Auto-save draft
  useEffect(() => {
    if (workout.exercises.length > 0 && !id) {
      saveDraft(workout);
    }
  }, [workout, id]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const applyPreset = (preset) => {
    setWorkout(prev => ({
      ...prev,
      title: preset.name,
      type: preset.type || "Custom",
      exercises: preset.exercises.map(e => ({
        ...e,
        id: generateId(),
        sets: e.sets.map(s => ({ ...s, id: generateId(), completed: false }))
      }))
    }));
    setPresetDialogOpen(false);
    toast.success(`Applied preset: ${preset.name}`);
  };

  const restoreDraft = () => {
    const draft = getDraft();
    if (draft) {
      setWorkout(draft);
      setShowDraftRestore(false);
      toast.success("Draft restored");
    }
  };

  const discardDraft = () => {
    clearDraft();
    setShowDraftRestore(false);
  };

  const addExercise = () => {
    const newExercise = {
      id: generateId(),
      name: "",
      sets: [{ id: generateId(), reps: 0, weight: 0, completed: false }]
    };
    setWorkout(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }));
    setExpandedExercise(newExercise.id);
  };

  const updateExercise = (exerciseId, field, value) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => 
        e.id === exerciseId ? { ...e, [field]: value } : e
      )
    }));
  };

  const removeExercise = (exerciseId) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== exerciseId)
    }));
  };

  const addSet = (exerciseId) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, { 
              id: generateId(), 
              reps: lastSet?.reps || 0, 
              weight: lastSet?.weight || 0,
              completed: false 
            }]
          };
        }
        return e;
      })
    }));
  };

  const updateSet = (exerciseId, setId, field, value) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map(s => 
              s.id === setId ? { ...s, [field]: field === 'completed' ? value : Number(value) } : s
            )
          };
        }
        return e;
      })
    }));
  };

  const removeSet = (exerciseId, setId) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId) {
          return { ...e, sets: e.sets.filter(s => s.id !== setId) };
        }
        return e;
      })
    }));
  };

  const handleSave = () => {
    if (!workout.title.trim()) {
      toast.error("Please enter a workout title");
      return;
    }
    
    if (workout.exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    // Detect PRs
    const prs = detectPRs(workout);
    
    const workoutToSave = {
      ...workout,
      id: workout.id || generateId(),
      duration: elapsedTime,
      prs,
    };

    saveWorkout(workoutToSave);
    clearDraft();
    
    if (prs.length > 0) {
      toast.success(`Workout saved with ${prs.length} new PR${prs.length > 1 ? 's' : ''}! 🎉`);
    } else {
      toast.success("Workout saved!");
    }
    
    navigate('/history');
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="workout-logger">
      {/* Draft Restore Banner */}
      {showDraftRestore && (
        <div className="glass p-4 rounded-lg flex items-center justify-between" data-testid="draft-restore-banner">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-zinc-300">You have an unsaved workout draft</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={discardDraft} className="border-white/10">
              Discard
            </Button>
            <Button size="sm" onClick={restoreDraft} className="bg-cyan-500 text-black hover:bg-cyan-400">
              Restore
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            {id ? 'Edit Workout' : 'Log Workout'}
          </h1>
          <p className="text-zinc-500 mt-1 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(elapsedTime)}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-white/10" data-testid="apply-preset-btn">
                Apply Preset
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-white/10">
              <DialogHeader>
                <DialogTitle className="font-heading text-xl uppercase">Select Preset</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-96 overflow-auto">
                {presets.length > 0 ? presets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="w-full text-left p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/50 border border-white/5 hover:border-cyan-500/30 transition-all"
                    data-testid={`preset-option-${preset.id}`}
                  >
                    <p className="font-medium text-white">{preset.name}</p>
                    <p className="text-xs text-zinc-500">{preset.exercises?.length || 0} exercises • {preset.type}</p>
                  </button>
                )) : (
                  <p className="text-center text-zinc-500 py-4">No presets yet</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleSave}
            className="bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-bold uppercase btn-scale"
            data-testid="save-workout-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Workout Details */}
      <Card className="glass" data-testid="workout-details-card">
        <CardContent className="p-6 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-400">Workout Title</Label>
              <Input
                value={workout.title}
                onChange={(e) => setWorkout(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Morning Push Day"
                className="bg-black/40 border-white/10"
                data-testid="workout-title-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Date</Label>
              <Input
                type="date"
                value={workout.date}
                onChange={(e) => setWorkout(prev => ({ ...prev, date: e.target.value }))}
                className="bg-black/40 border-white/10"
                data-testid="workout-date-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Type</Label>
              <Select 
                value={workout.type} 
                onValueChange={(value) => setWorkout(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-black/40 border-white/10" data-testid="workout-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  {WORKOUT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Notes</Label>
              <Input
                value={workout.notes}
                onChange={(e) => setWorkout(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes..."
                className="bg-black/40 border-white/10"
                data-testid="workout-notes-input"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercises */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-bold text-xl uppercase text-zinc-300">Exercises</h2>
          <Button 
            onClick={addExercise}
            variant="outline" 
            className="border-white/10 hover:border-cyan-500/30"
            data-testid="add-exercise-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Exercise
          </Button>
        </div>

        {workout.exercises.length === 0 ? (
          <Card className="glass border-dashed" data-testid="no-exercises-card">
            <CardContent className="p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
              <p className="text-zinc-500">No exercises added yet</p>
              <p className="text-xs text-zinc-600 mt-1">Click "Add Exercise" to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {workout.exercises.map((exercise, exerciseIndex) => (
              <Card key={exercise.id} className="glass card-hover" data-testid={`exercise-card-${exerciseIndex}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <span className="font-mono text-cyan-400 text-sm">{exerciseIndex + 1}</span>
                      </div>
                      <Select 
                        value={exercise.name || ""} 
                        onValueChange={(value) => updateExercise(exercise.id, 'name', value)}
                      >
                        <SelectTrigger className="bg-black/40 border-white/10 max-w-xs" data-testid={`exercise-name-${exerciseIndex}`}>
                          <SelectValue placeholder="Select exercise" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                          {COMMON_EXERCISES.map(ex => (
                            <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedExercise(expandedExercise === exercise.id ? null : exercise.id)}
                        data-testid={`toggle-exercise-${exerciseIndex}`}
                      >
                        {expandedExercise === exercise.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-400 hover:text-red-300"
                        data-testid={`remove-exercise-${exerciseIndex}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                {(expandedExercise === exercise.id || true) && (
                  <CardContent className="pt-0">
                    {/* Sets Header */}
                    <div className="grid grid-cols-12 gap-2 mb-2 px-2 text-xs text-zinc-500 font-mono uppercase">
                      <div className="col-span-1">Set</div>
                      <div className="col-span-4">Weight (kg)</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-3"></div>
                    </div>

                    {/* Sets */}
                    <div className="space-y-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div key={set.id} className="grid grid-cols-12 gap-2 items-center" data-testid={`set-${exerciseIndex}-${setIndex}`}>
                          <div className="col-span-1">
                            <span className="font-mono text-zinc-400 text-sm">{setIndex + 1}</span>
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              value={set.weight || ""}
                              onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 font-mono"
                              placeholder="0"
                              data-testid={`weight-${exerciseIndex}-${setIndex}`}
                            />
                          </div>
                          <div className="col-span-4">
                            <Input
                              type="number"
                              value={set.reps || ""}
                              onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                              className="bg-black/40 border-white/10 h-10 font-mono"
                              placeholder="0"
                              data-testid={`reps-${exerciseIndex}-${setIndex}`}
                            />
                          </div>
                          <div className="col-span-3 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSet(exercise.id, set.id)}
                              className="text-zinc-500 hover:text-red-400"
                              disabled={exercise.sets.length === 1}
                              data-testid={`remove-set-${exerciseIndex}-${setIndex}`}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add Set Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSet(exercise.id)}
                      className="mt-2 text-cyan-400 hover:text-cyan-300"
                      data-testid={`add-set-${exerciseIndex}`}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Set
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutLogger;
