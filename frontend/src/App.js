import "@/index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import WorkoutLogger from "@/pages/WorkoutLogger";
import History from "@/pages/History";
import Planner from "@/pages/Planner";
import Presets from "@/pages/Presets";
import Progress from "@/pages/Progress";
import Achievements from "@/pages/Achievements";
import Settings from "@/pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-zen-bg">
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/log" element={<WorkoutLogger />} />
            <Route path="/log/:id" element={<WorkoutLogger />} />
            <Route path="/history" element={<History />} />
            <Route path="/history/:id" element={<History />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/presets" element={<Presets />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="bottom-right" theme="dark" />
    </div>
  );
}

export default App;
