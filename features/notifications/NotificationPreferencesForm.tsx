"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { NotificationPrefsDto } from "@/types/notifications";

export function NotificationPreferencesForm() {
  const query = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: async () => {
      const res = await fetch("/api/user/notification-preferences");
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<NotificationPrefsDto>;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: NotificationPrefsDto) => {
      const res = await fetch("/api/user/notification-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
    },
  });

  if (!query.data) return null;
  const prefs = query.data;

  function update<K extends keyof NotificationPrefsDto>(
    key: K,
    value: NotificationPrefsDto[K],
  ) {
    saveMutation.mutate({ ...prefs, [key]: value });
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        saveMutation.mutate(prefs);
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="reminderTime">Daily reminder time</Label>
        <Input
          id="reminderTime"
          type="time"
          defaultValue={prefs.reminderTime}
          onChange={(e) => update("reminderTime", e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          defaultValue={prefs.timezone}
          onChange={(e) => update("timezone", e.target.value)}
        />
      </div>
      {(
        [
          ["dailyReminder", "Daily study reminders"],
          ["streakAlerts", "Streak at-risk alerts"],
          ["examAlerts", "Exam countdown alerts"],
          ["milestoneAlerts", "Milestone alerts"],
          ["emailEnabled", "Email notifications"],
        ] as const
      ).map(([key, label]) => (
        <div key={key} className="flex items-center justify-between">
          <Label htmlFor={key}>{label}</Label>
          <Switch
            id={key}
            defaultChecked={prefs[key]}
            onCheckedChange={(v) => update(key, v)}
          />
        </div>
      ))}
      <Button type="submit" disabled={saveMutation.isPending}>
        Save preferences
      </Button>
    </form>
  );
}
