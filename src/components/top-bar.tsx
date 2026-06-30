import { Bell, Moon, Search, Settings, Sun, User } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTheme } from "@/lib/theme";
import { useEffect, useState } from "react";
import { readJSON, type HistoryEntry, KEYS } from "@/lib/storage";

export function TopBar() {
  const { theme, toggle } = useTheme();
  const [notifs, setNotifs] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const load = () => setNotifs(readJSON<HistoryEntry[]>(KEYS.history, []).slice(0, 6));
    load();
    const handler = () => load();
    window.addEventListener("wpa:storage", handler);
    return () => window.removeEventListener("wpa:storage", handler);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/70 px-3 backdrop-blur-xl sm:px-4">
      <SidebarTrigger />
      <div className="relative ml-1 hidden flex-1 max-w-md sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search everything…"
          className="pl-9 bg-muted/40 border-transparent focus-visible:border-border"
        />
        <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1.5 py-0.5 text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b p-3">
              <div className="text-sm font-semibold">Notifications</div>
              <div className="text-xs text-muted-foreground">
                {notifs.length} recent activity
              </div>
            </div>
            <div className="max-h-72 overflow-auto">
              {notifs.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  Nothing yet. Use a tool to see activity.
                </div>
              )}
              {notifs.map((n) => (
                <div key={n.id} className="border-b px-3 py-2 text-xs last:border-b-0">
                  <div className="font-medium">{n.tool}</div>
                  <div className="text-muted-foreground">{n.action}</div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" asChild aria-label="Settings">
          <Link to="/settings">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Profile">
              <div className="grid h-7 w-7 place-items-center rounded-full gradient-primary text-[11px] font-semibold text-white">
                AM
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm">Alex Morgan</span>
                <span className="text-xs font-normal text-muted-foreground">
                  alex@company.com
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <User className="mr-2 h-3.5 w-3.5" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">
                <Settings className="mr-2 h-3.5 w-3.5" /> Settings
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
