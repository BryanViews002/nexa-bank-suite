import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  CreditCard,
  LayoutGrid,
  LogOut,
  Moon,
  Receipt,
  Settings,
  Sun,
  Wallet,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useTheme } from "@/contexts/ThemeContext";

export function GlobalCommandMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { setTheme } = useTheme();
  const adminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (adminRoute) return;
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [adminRoute]);

  useEffect(() => {
    if (adminRoute) setOpen(false);
  }, [adminRoute]);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  if (adminRoute) return null;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard"))}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            <span>Overview</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard?tab=accounts"))}>
            <Wallet className="mr-2 h-4 w-4" />
            <span>Accounts</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard?tab=transactions"))}>
            <Receipt className="mr-2 h-4 w-4" />
            <span>Transactions</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate("/dashboard?tab=move-money"))}>
            <ArrowLeftRight className="mr-2 h-4 w-4" />
            <span>Move money</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Quick Actions">
          <CommandItem onSelect={() => runCommand(() => console.log("Request virtual card"))}>
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Request virtual card</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => console.log("Settings"))}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Account settings</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Theme">
          <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
            <Sun className="mr-2 h-4 w-4" />
            <span>Light mode</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
            <Moon className="mr-2 h-4 w-4" />
            <span>Dark mode</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Account">
          <CommandItem onSelect={() => runCommand(() => navigate("/login"))}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
