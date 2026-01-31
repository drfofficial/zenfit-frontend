import { Outlet, NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Dumbbell, 
  History, 
  Calendar, 
  BookTemplate, 
  TrendingUp, 
  Trophy, 
  Settings,
  Zap,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import QuickLogModal from "@/components/QuickLogModal";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/log", icon: Dumbbell, label: "Log Workout" },
  { to: "/history", icon: History, label: "History" },
  { to: "/planner", icon: Calendar, label: "Planner" },
  { to: "/presets", icon: BookTemplate, label: "Presets" },
  { to: "/progress", icon: TrendingUp, label: "Progress" },
  { to: "/achievements", icon: Trophy, label: "Achievements" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-zen-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-white/5 bg-zen-card/50 backdrop-blur-xl">
        {/* Logo */}
        <div className="p-6 border-b border-white/5">
          <h1 className="font-heading font-black text-3xl tracking-tight uppercase">
            <span className="text-cyan-400">Zen</span>
            <span className="text-white">Fit</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1 font-mono">TRACK • GROW • CONQUER</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                  "hover:bg-white/5 group",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                    : "text-zinc-400"
                )
              }
              data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-5 h-5" strokeWidth={1.5} />
              <span className="font-medium text-sm">{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Log Button */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => setQuickLogOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-black font-heading font-bold uppercase tracking-wider rounded-lg hover:bg-cyan-400 transition-all btn-scale glow-cyan"
            data-testid="quick-log-btn"
          >
            <Zap className="w-5 h-5" />
            Quick Log
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zen-bg/95 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="font-heading font-black text-2xl tracking-tight uppercase">
            <span className="text-cyan-400">Zen</span>
            <span className="text-white">Fit</span>
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuickLogOpen(true)}
              className="p-2 bg-cyan-500 text-black rounded-lg"
              data-testid="mobile-quick-log-btn"
            >
              <Zap className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-zinc-400 hover:text-white"
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1 animate-fade-in">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-zinc-400 hover:bg-white/5"
                  )
                }
                data-testid={`mobile-nav-${label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:p-8 p-4 pt-20 lg:pt-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Quick Log Modal */}
      <QuickLogModal open={quickLogOpen} onOpenChange={setQuickLogOpen} />
    </div>
  );
};

export default Layout;
