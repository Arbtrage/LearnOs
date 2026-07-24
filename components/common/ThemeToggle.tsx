"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Select
      value={theme ?? "dark"}
      onValueChange={(value) => {
        if (value) setTheme(value);
      }}
    >
      <SelectTrigger className="w-[130px]" aria-label="Select theme">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <span className="flex items-center gap-2">
            <Moon className="size-4" />
            Dark
          </span>
        </SelectItem>
        <SelectItem value="light">
          <span className="flex items-center gap-2">
            <Sun className="size-4" />
            Light
          </span>
        </SelectItem>
        <SelectItem value="system">
          <span className="flex items-center gap-2">
            <Monitor className="size-4" />
            System
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
