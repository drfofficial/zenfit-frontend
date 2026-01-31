import { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Target,
  Download,
  Upload,
  Trash2,
  Info
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { getSettings, saveSettings, exportData, importData } from "@/lib/storage";

const Settings = () => {
  const [settings, setSettings] = useState({
    weeklyGoal: 3,
    streakBreakOnMiss: true,
    showAchievements: true,
    weightUnit: 'kg',
    startOfWeek: 1,
  });
  const [clearDataDialogOpen, setClearDataDialogOpen] = useState(false);
  const [importInput, setImportInput] = useState(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
    toast.success("Settings updated");
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zenfit-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const handleImport = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result);
        importData(data);
        toast.success("Data imported successfully");
        window.location.reload();
      } catch (err) {
        toast.error("Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    localStorage.clear();
    toast.success("All data cleared");
    setClearDataDialogOpen(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      {/* Header */}
      <div>
        <h1 className="font-heading font-black text-4xl sm:text-5xl tracking-tight uppercase text-white">
          Settings
        </h1>
        <p className="text-zinc-500 mt-1">Customize your experience</p>
      </div>

      {/* Weekly Goal */}
      <Card className="glass" data-testid="weekly-goal-settings">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase text-zinc-300 flex items-center gap-2">
            <Target className="w-5 h-5 text-cyan-400" />
            Weekly Goal
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Set your target workouts per week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Workouts per week</Label>
            <Select 
              value={String(settings.weeklyGoal)} 
              onValueChange={(v) => updateSetting('weeklyGoal', parseInt(v))}
            >
              <SelectTrigger className="w-32 bg-black/40 border-white/10" data-testid="weekly-goal-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                {[1, 2, 3, 4, 5, 6, 7].map(n => (
                  <SelectItem key={n} value={String(n)}>{n} {n === 1 ? 'workout' : 'workouts'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300">Break streak on missed goal</Label>
              <p className="text-xs text-zinc-500 mt-1">Reset streak if you miss your weekly goal</p>
            </div>
            <Switch
              checked={settings.streakBreakOnMiss}
              onCheckedChange={(v) => updateSetting('streakBreakOnMiss', v)}
              data-testid="streak-break-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="glass" data-testid="preferences-settings">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase text-zinc-300 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Weight unit</Label>
            <Select 
              value={settings.weightUnit} 
              onValueChange={(v) => updateSetting('weightUnit', v)}
            >
              <SelectTrigger className="w-32 bg-black/40 border-white/10" data-testid="weight-unit-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="kg">Kilograms (kg)</SelectItem>
                <SelectItem value="lbs">Pounds (lbs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-zinc-300">Start of week</Label>
            <Select 
              value={String(settings.startOfWeek)} 
              onValueChange={(v) => updateSetting('startOfWeek', parseInt(v))}
            >
              <SelectTrigger className="w-32 bg-black/40 border-white/10" data-testid="week-start-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10">
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-zinc-300">Show achievements</Label>
              <p className="text-xs text-zinc-500 mt-1">Display badges and milestones</p>
            </div>
            <Switch
              checked={settings.showAchievements}
              onCheckedChange={(v) => updateSetting('showAchievements', v)}
              data-testid="show-achievements-switch"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="glass" data-testid="data-management-settings">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase text-zinc-300 flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Data Management
          </CardTitle>
          <CardDescription className="text-zinc-500">
            Export, import, or clear your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleExport}
              variant="outline" 
              className="border-white/10 hover:bg-white/5"
              data-testid="export-data-btn"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            
            <div>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
                id="import-file"
                data-testid="import-file-input"
              />
              <Button 
                onClick={() => document.getElementById('import-file')?.click()}
                variant="outline" 
                className="border-white/10 hover:bg-white/5"
                data-testid="import-data-btn"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5">
            <Button 
              onClick={() => setClearDataDialogOpen(true)}
              variant="outline" 
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              data-testid="clear-data-btn"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
            <p className="text-xs text-zinc-600 mt-2">
              This will permanently delete all your workouts, presets, and settings.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* About */}
      <Card className="glass" data-testid="about-settings">
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase text-zinc-300 flex items-center gap-2">
            <Info className="w-5 h-5 text-cyan-400" />
            About ZenFit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-zinc-400">
            <p><strong className="text-white">Version:</strong> 1.0.0</p>
            <p><strong className="text-white">Storage:</strong> Local browser storage (data stays on your device)</p>
            <p><strong className="text-white">Theme:</strong> Cyber-Zen Dark Mode</p>
          </div>
        </CardContent>
      </Card>

      {/* Clear Data Confirmation */}
      <AlertDialog open={clearDataDialogOpen} onOpenChange={setClearDataDialogOpen}>
        <AlertDialogContent className="glass border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Clear All Data?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. All your workouts, presets, achievements, and settings will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleClearData}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Clear All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
