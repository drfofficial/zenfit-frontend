// ZenFit Local Storage Manager
const STORAGE_KEYS = {
  WORKOUTS: 'zenfit_workouts',
  PRESETS: 'zenfit_presets',
  SETTINGS: 'zenfit_settings',
  ACHIEVEMENTS: 'zenfit_achievements',
  PLANNER: 'zenfit_planner',
  DRAFTS: 'zenfit_drafts',
};

// Utility functions
export const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const getToday = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekEnd = (date = new Date()) => {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

// Generic storage functions
const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Error reading ${key} from localStorage:`, e);
    return null;
  }
};

const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing ${key} to localStorage:`, e);
    return false;
  }
};

// WORKOUTS
export const getWorkouts = () => getItem(STORAGE_KEYS.WORKOUTS) || [];

export const saveWorkout = (workout) => {
  const workouts = getWorkouts();
  const existingIndex = workouts.findIndex(w => w.id === workout.id);
  
  if (existingIndex >= 0) {
    workouts[existingIndex] = { ...workout, updatedAt: new Date().toISOString() };
  } else {
    workouts.push({
      ...workout,
      id: workout.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  setItem(STORAGE_KEYS.WORKOUTS, workouts);
  return workouts;
};

export const deleteWorkout = (workoutId) => {
  const workouts = getWorkouts().filter(w => w.id !== workoutId);
  setItem(STORAGE_KEYS.WORKOUTS, workouts);
  return workouts;
};

export const duplicateWorkout = (workoutId) => {
  const workouts = getWorkouts();
  const original = workouts.find(w => w.id === workoutId);
  if (!original) return workouts;
  
  const duplicate = {
    ...original,
    id: generateId(),
    title: `${original.title} (Copy)`,
    date: getToday(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isFavorite: false,
  };
  
  workouts.push(duplicate);
  setItem(STORAGE_KEYS.WORKOUTS, workouts);
  return workouts;
};

// PRESETS
export const getPresets = () => getItem(STORAGE_KEYS.PRESETS) || [];

export const savePreset = (preset) => {
  const presets = getPresets();
  const existingIndex = presets.findIndex(p => p.id === preset.id);
  
  if (existingIndex >= 0) {
    presets[existingIndex] = { ...preset, updatedAt: new Date().toISOString() };
  } else {
    presets.push({
      ...preset,
      id: preset.id || generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  
  setItem(STORAGE_KEYS.PRESETS, presets);
  return presets;
};

export const deletePreset = (presetId) => {
  const presets = getPresets().filter(p => p.id !== presetId);
  setItem(STORAGE_KEYS.PRESETS, presets);
  return presets;
};

// SETTINGS
export const getSettings = () => {
  return getItem(STORAGE_KEYS.SETTINGS) || {
    weeklyGoal: 3,
    streakBreakOnMiss: true,
    showAchievements: true,
    weightUnit: 'kg',
    startOfWeek: 1, // Monday
  };
};

export const saveSettings = (settings) => {
  setItem(STORAGE_KEYS.SETTINGS, settings);
  return settings;
};

// ACHIEVEMENTS
export const getAchievements = () => {
  return getItem(STORAGE_KEYS.ACHIEVEMENTS) || {
    unlocked: [],
    stats: {
      totalWorkouts: 0,
      totalVolume: 0,
      longestStreak: 0,
      currentStreak: 0,
      weeksGoalMet: 0,
    }
  };
};

export const saveAchievements = (achievements) => {
  setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  return achievements;
};

export const unlockAchievement = (achievementId) => {
  const achievements = getAchievements();
  if (!achievements.unlocked.includes(achievementId)) {
    achievements.unlocked.push(achievementId);
    achievements.unlockedAt = achievements.unlockedAt || {};
    achievements.unlockedAt[achievementId] = new Date().toISOString();
    setItem(STORAGE_KEYS.ACHIEVEMENTS, achievements);
  }
  return achievements;
};

// PLANNER
export const getPlanner = () => {
  return getItem(STORAGE_KEYS.PLANNER) || {
    weeklyPlan: {
      0: null, // Sunday
      1: null, // Monday
      2: null, // Tuesday
      3: null, // Wednesday
      4: null, // Thursday
      5: null, // Friday
      6: null, // Saturday
    },
    scheduledWorkouts: [], // One-off scheduled workouts
  };
};

export const savePlanner = (planner) => {
  setItem(STORAGE_KEYS.PLANNER, planner);
  return planner;
};

// DRAFTS
export const getDraft = () => getItem(STORAGE_KEYS.DRAFTS);

export const saveDraft = (draft) => {
  setItem(STORAGE_KEYS.DRAFTS, { ...draft, savedAt: new Date().toISOString() });
};

export const clearDraft = () => {
  localStorage.removeItem(STORAGE_KEYS.DRAFTS);
};

// ANALYTICS HELPERS
export const getWorkoutsInRange = (startDate, endDate) => {
  const workouts = getWorkouts();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return workouts.filter(w => {
    const date = new Date(w.date);
    return date >= start && date <= end;
  });
};

export const getWorkoutsThisWeek = () => {
  return getWorkoutsInRange(getWeekStart(), getWeekEnd());
};

export const calculateVolume = (workout) => {
  if (!workout.exercises) return 0;
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => {
      return setTotal + (set.reps * set.weight);
    }, 0);
  }, 0);
};

export const getTotalSets = (workout) => {
  if (!workout.exercises) return 0;
  return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
};

export const getTotalReps = (workout) => {
  if (!workout.exercises) return 0;
  return workout.exercises.reduce((total, exercise) => {
    return total + exercise.sets.reduce((setTotal, set) => setTotal + set.reps, 0);
  }, 0);
};

// PR Detection
export const detectPRs = (workout) => {
  const allWorkouts = getWorkouts().filter(w => w.id !== workout.id);
  const prs = [];
  
  if (!workout.exercises) return prs;
  
  workout.exercises.forEach(exercise => {
    const previousExercises = allWorkouts
      .flatMap(w => w.exercises || [])
      .filter(e => e.name.toLowerCase() === exercise.name.toLowerCase());
    
    exercise.sets.forEach((set, setIndex) => {
      // Check for weight PR
      const maxPreviousWeight = Math.max(0, ...previousExercises
        .flatMap(e => e.sets)
        .map(s => s.weight));
      
      if (set.weight > maxPreviousWeight && maxPreviousWeight > 0) {
        prs.push({
          type: 'weight',
          exercise: exercise.name,
          value: set.weight,
          previous: maxPreviousWeight,
          setIndex,
        });
      }
      
      // Check for reps PR at same weight
      const maxRepsAtWeight = Math.max(0, ...previousExercises
        .flatMap(e => e.sets)
        .filter(s => s.weight === set.weight)
        .map(s => s.reps));
      
      if (set.reps > maxRepsAtWeight && maxRepsAtWeight > 0) {
        prs.push({
          type: 'reps',
          exercise: exercise.name,
          value: set.reps,
          weight: set.weight,
          previous: maxRepsAtWeight,
          setIndex,
        });
      }
    });
  });
  
  return prs;
};

// Calculate current streak
export const calculateStreak = () => {
  const workouts = getWorkouts().sort((a, b) => new Date(b.date) - new Date(a.date));
  const settings = getSettings();
  
  if (workouts.length === 0) return 0;
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Check consecutive weeks meeting goal
  while (true) {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = getWeekEnd(currentDate);
    const weekWorkouts = workouts.filter(w => {
      const d = new Date(w.date);
      return d >= weekStart && d <= weekEnd;
    });
    
    if (weekWorkouts.length >= settings.weeklyGoal) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 7);
    } else {
      // Check if current week is still in progress
      const now = new Date();
      if (weekStart <= now && weekEnd >= now) {
        currentDate.setDate(currentDate.getDate() - 7);
        continue;
      }
      break;
    }
    
    // Safety limit
    if (streak > 100) break;
  }
  
  return streak;
};

// Export all data (for backup)
export const exportData = () => {
  return {
    workouts: getWorkouts(),
    presets: getPresets(),
    settings: getSettings(),
    achievements: getAchievements(),
    planner: getPlanner(),
    exportedAt: new Date().toISOString(),
  };
};

// Import data
export const importData = (data) => {
  if (data.workouts) setItem(STORAGE_KEYS.WORKOUTS, data.workouts);
  if (data.presets) setItem(STORAGE_KEYS.PRESETS, data.presets);
  if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
  if (data.achievements) setItem(STORAGE_KEYS.ACHIEVEMENTS, data.achievements);
  if (data.planner) setItem(STORAGE_KEYS.PLANNER, data.planner);
  return true;
};
