import { useState } from "react";
import { 
  Zap,
  Plus,
  X,
  Save
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { saveWorkout, generateId, getToday } from "@/lib/storage";

const COMMON_EXERCISES = [
  "Bench Press", "Squat", "Deadlift", "Overhead Press", "Barbell Row",
  "Pull-ups", "Dips", "Lunges", "Leg Press", "Lat Pulldown",
  "Bicep Curls", "Tricep Extensions", "Leg Curls", "Leg Extensions",
  "Calf Raises", "Plank", "Romanian Deadlift", "Face Pulls"
];

const QuickLogModal = ({ open, onOpenChange }) => {
  const [exercise, setExercise] = useState("");
  const [sets, setSets] = useState([
    { id: generateId(), reps: 0, weight: 0 }
  ]);

  const addSet = () => {
    const lastSet = sets[sets.length - 1];
    setSets([...sets, { 
      id: generateId(), 
      reps: lastSet?.reps || 0, 
      weight: lastSet?.weight || 0 
    }]);
  };

  const updateSet = (setId, field, value) => {
    setSets(sets.map(s => 
      s.id === setId ? { ...s, [field]: Number(value) } : s
    ));
  };

  const removeSet = (setId) => {
    if (sets.length > 1) {
      setSets(sets.filter(s => s.id !== setId));
    }
  };

  const handleSave = () => {
    if (!exercise) {
      toast.error("Please select an exercise");
      return;
    }

    const validSets = sets.filter(s => s.reps > 0);
    if (validSets.length === 0) {
      toast.error("Please add at least one set with reps");
      return;
    }

    const workout = {
      id: generateId(),
      title: `Quick Log - ${exercise}`,
      date: getToday(),
      type: "Custom",
      duration: 0,
      notes: "Quick logged",
      exercises: [{
        id: generateId(),
        name: exercise,
        sets: validSets.map(s => ({ ...s, completed: true }))
      }],
      prs: [],
    };

    saveWorkout(workout);
    toast.success("Quick log saved!");
    
    // Reset form
    setExercise("");
    setSets([{ id: generateId(), reps: 0, weight: 0 }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass border-white/10 sm:max-w-md" data-testid="quick-log-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Quick Log
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Exercise Select */}
          <div className="space-y-2">
            <Label className="text-zinc-400">Exercise</Label>
            <Select value={exercise} onValueChange={setExercise}>
              <SelectTrigger className="bg-black/40 border-white/10" data-testid="quick-exercise-select">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 max-h-60">
                {COMMON_EXERCISES.map(ex => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sets */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-zinc-400">Sets</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addSet}
                className="text-cyan-400 hover:text-cyan-300"
                data-testid="quick-add-set"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Set
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-zinc-500 font-mono uppercase px-1">
              <div className="col-span-2">Set</div>
              <div className="col-span-4">Weight</div>
              <div className="col-span-4">Reps</div>
              <div className="col-span-2"></div>
            </div>

            {/* Set rows */}
            <div className="space-y-2 max-h-48 overflow-auto">
              {sets.map((set, index) => (
                <div key={set.id} className="grid grid-cols-12 gap-2 items-center" data-testid={`quick-set-${index}`}>
                  <div className="col-span-2">
                    <span className="font-mono text-zinc-400 text-sm pl-1">{index + 1}</span>
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={set.weight || ""}
                      onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                      className="bg-black/40 border-white/10 h-10 font-mono"
                      placeholder="0"
                      data-testid={`quick-weight-${index}`}
                    />
                  </div>
                  <div className="col-span-4">
                    <Input
                      type="number"
                      value={set.reps || ""}
                      onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                      className="bg-black/40 border-white/10 h-10 font-mono"
                      placeholder="0"
                      data-testid={`quick-reps-${index}`}
                    />
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSet(set.id)}
                      className="w-full h-10 text-zinc-500 hover:text-red-400"
                      disabled={sets.length === 1}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            className="bg-cyan-500 text-black hover:bg-cyan-400 font-heading font-bold uppercase"
            data-testid="quick-save-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QuickLogModal;
