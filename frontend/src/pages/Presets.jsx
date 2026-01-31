import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit,
  Star,
  StarOff,
  Copy,
  Dumbbell,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { getPresets, savePreset, deletePreset, generateId } from "@/lib/storage";

const WORKOUT_TYPES = ["Push", "Pull", "Legs", "Upper", "Lower", "Full Body", "Cardio", "Core", "Custom"];

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull-ups", "Dips", "Lunges", "Leg Press", "Lat Pulldown",
  "Bicep Curls", "Tricep Extensions", "Leg Curls", "Leg Extensions",
  "Calf Raises", "Plank", "Romanian Deadlift", "Face Pulls"
];

const emptyPreset = {
  id: null,
  name: "",
  type: "Custom",
  exercises: [],
  isFavorite: false,
  tags: []
};

const Presets = () => {
  const [presets, setPresets] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(emptyPreset);
  const [presetToDelete, setPresetToDelete] = useState(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = () => {
    const data = getPresets();
    // Sort by favorite first, then by name
    const sorted = data.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
    setPresets(sorted);
  };

  const openNewPreset = () => {
    setCurrentPreset({
      ...emptyPreset,
      exercises: [{
        id: generateId(),
        name: "",
        sets: [{ id: generateId(), reps: 8, weight: 0, rest: 90 }]
      }]
    });
    setEditDialogOpen(true);
  };

  const openEditPreset = (preset) => {
    setCurrentPreset({ ...preset });
    setEditDialogOpen(true);
  };

  const addExercise = () => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: generateId(),
          name: "",
          sets: [{ id: generateId(), reps: 8, weight: 0, rest: 90 }]
        }
      ]
    }));
  };

  const removeExercise = (exerciseId) => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.id !== exerciseId)
    }));
  };

  const updateExercise = (exerciseId, field, value) => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => 
        e.id === exerciseId ? { ...e, [field]: value } : e
      )
    }));
  };

  const addSet = (exerciseId) => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId) {
          const lastSet = e.sets[e.sets.length - 1];
          return {
            ...e,
            sets: [...e.sets, { 
              id: generateId(), 
              reps: lastSet?.reps || 8, 
              weight: lastSet?.weight || 0,
              rest: lastSet?.rest || 90
            }]
          };
        }
        return e;
      })
    }));
  };

  const removeSet = (exerciseId, setId) => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId && e.sets.length > 1) {
          return { ...e, sets: e.sets.filter(s => s.id !== setId) };
        }
        return e;
      })
    }));
  };

  const updateSet = (exerciseId, setId, field, value) => {
    setCurrentPreset(prev => ({
      ...prev,
      exercises: prev.exercises.map(e => {
        if (e.id === exerciseId) {
          return {
            ...e,
            sets: e.sets.map(s => 
              s.id === setId ? { ...s, [field]: Number(value) } : s
            )
          };
        }
        return e;
      })
    }));
  };

  const handleSave = () => {
    if (!currentPreset.name.trim()) {
      toast.error("Please enter a preset name");
      return;
    }
    
    if (currentPreset.exercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    const hasEmptyExercise = currentPreset.exercises.some(e => !e.name);
    if (hasEmptyExercise) {
      toast.error("Please select an exercise for all entries");
      return;
    }

    const presetToSave = {
      ...currentPreset,
      id: currentPreset.id || generateId()
    };

    savePreset(presetToSave);
    loadPresets();
    setEditDialogOpen(false);
    toast.success(currentPreset.id ? "Preset updated" : "Preset created");
  };

  const confirmDelete = (preset) => {
    setPresetToDelete(preset);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (presetToDelete) {
      deletePreset(presetToDelete.id);
      loadPresets();
      toast.success("Preset deleted");
    }
    setDeleteDialogOpen(false);
    setPresetToDelete(null);
  };

  const toggleFavorite = (preset) => {
    const updated = { ...preset, isFavorite: !preset.isFavorite };
    savePreset(updated);
    loadPresets();
    toast.success(updated.isFavorite ? "Added to favorites" : "Removed from favorites");
  };

  const duplicatePreset = (preset) => {
    const duplicate = {
      ...preset,
      id: generateId(),
      name: `${preset.name} (Copy)`,
      isFavorite: false
    };
    savePreset(duplicate);
    loadPresets();
    toast.success("Preset duplicated");
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="presets-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
            Presets
          </h1>
          <p className="text-zinc-500 mt-1">{presets.length} workout templates</p>
        </div>
        <Button
          onClick={openNewPreset}
          className="bg-cyan-500 hover:bg-cyan-400 text-black font-heading font-bold uppercase btn-scale"
          data-testid="create-preset-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Preset
        </Button>
      </div>

      {/* Presets Grid */}
      {presets.length === 0 ? (
        <Card className="glass" data-testid="no-presets-card">
          <CardContent className="p-12 text-center">
            <Dumbbell className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-500">No presets yet</p>
            <p className="text-xs text-zinc-600 mt-1">Create templates to speed up your logging</p>
            <Button
              onClick={openNewPreset}
              variant="outline"
              className="mt-4 border-white/10"
            >
              Create First Preset
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {presets.map(preset => (
            <Card 
              key={preset.id} 
              className="glass card-hover"
              data-testid={`preset-card-${preset.id}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {preset.isFavorite && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />}
                      <CardTitle className="font-heading text-lg uppercase text-white truncate">
                        {preset.name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 text-xs">
                      {preset.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Exercise list */}
                <div className="space-y-1 mb-4">
                  {preset.exercises?.slice(0, 4).map((exercise, i) => (
                    <p key={i} className="text-sm text-zinc-400 truncate">
                      • {exercise.name} ({exercise.sets?.length || 0} sets)
                    </p>
                  ))}
                  {preset.exercises?.length > 4 && (
                    <p className="text-xs text-zinc-500">
                      +{preset.exercises.length - 4} more exercises
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-3 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFavorite(preset)}
                    className="text-zinc-400 hover:text-yellow-500"
                    data-testid={`favorite-preset-${preset.id}`}
                  >
                    {preset.isFavorite ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditPreset(preset)}
                    className="text-zinc-400 hover:text-cyan-400"
                    data-testid={`edit-preset-${preset.id}`}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicatePreset(preset)}
                    className="text-zinc-400 hover:text-white"
                    data-testid={`duplicate-preset-${preset.id}`}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => confirmDelete(preset)}
                    className="text-zinc-400 hover:text-red-400 ml-auto"
                    data-testid={`delete-preset-${preset.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit/Create Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase">
              {currentPreset.id ? 'Edit Preset' : 'New Preset'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400">Name</Label>
                <Input
                  value={currentPreset.name}
                  onChange={(e) => setCurrentPreset(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Push Day A"
                  className="bg-black/40 border-white/10"
                  data-testid="preset-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400">Type</Label>
                <Select 
                  value={currentPreset.type} 
                  onValueChange={(value) => setCurrentPreset(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-black/40 border-white/10" data-testid="preset-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    {WORKOUT_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-zinc-400">Exercises</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addExercise}
                  className="border-white/10"
                  data-testid="add-preset-exercise"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {currentPreset.exercises.map((exercise, i) => (
                <div key={exercise.id} className="p-3 rounded-lg bg-zinc-900/50 border border-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 text-sm w-6">{i + 1}.</span>
                    <Select 
                      value={exercise.name} 
                      onValueChange={(value) => updateExercise(exercise.id, 'name', value)}
                    >
                      <SelectTrigger className="flex-1 bg-black/40 border-white/10" data-testid={`preset-exercise-${i}`}>
                        <SelectValue placeholder="Select exercise" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                        {COMMON_EXERCISES.map(ex => (
                          <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExercise(exercise.id)}
                      className="text-zinc-500 hover:text-red-400"
                      disabled={currentPreset.exercises.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2 pl-8">
                    <div className="grid grid-cols-4 gap-2 text-xs text-zinc-500 font-mono uppercase">
                      <span>Set</span>
                      <span>Reps</span>
                      <span>Weight</span>
                      <span>Rest (s)</span>
                    </div>
                    {exercise.sets.map((set, j) => (
                      <div key={set.id} className="grid grid-cols-4 gap-2 items-center">
                        <span className="font-mono text-zinc-500 text-sm">{j + 1}</span>
                        <Input
                          type="number"
                          value={set.reps || ""}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', e.target.value)}
                          className="bg-black/40 border-white/10 h-8 font-mono text-sm"
                        />
                        <Input
                          type="number"
                          value={set.weight || ""}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', e.target.value)}
                          className="bg-black/40 border-white/10 h-8 font-mono text-sm"
                          placeholder="0"
                        />
                        <div className="flex gap-1">
                          <Input
                            type="number"
                            value={set.rest || ""}
                            onChange={(e) => updateSet(exercise.id, set.id, 'rest', e.target.value)}
                            className="bg-black/40 border-white/10 h-8 font-mono text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSet(exercise.id, set.id)}
                            className="h-8 w-8 p-0 text-zinc-600 hover:text-red-400"
                            disabled={exercise.sets.length === 1}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addSet(exercise.id)}
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Set
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)} className="border-white/10">
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-cyan-500 text-black hover:bg-cyan-400" data-testid="save-preset-btn">
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Preset?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This will permanently delete "{presetToDelete?.name}". This action cannot be undone.
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

export default Presets;
