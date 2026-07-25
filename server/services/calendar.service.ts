import { parseDailyCommitmentMinutes } from "@/lib/curriculum/time-budget";
import { blueprintRepository } from "@/server/repositories/blueprint.repository";
import { projectRepository } from "@/server/repositories/project.repository";
import { studyPlanRepository } from "@/server/repositories/study-plan.repository";
import { studyTaskRepository } from "@/server/repositories/study-task.repository";
import { revisionCardRepository } from "@/server/repositories/revision-card.repository";
import { DailyPlannerService } from "@/server/services/daily-planner.service";
import type { CalendarExportRange, IcsEvent } from "@/types/calendar";

function formatIcsDate(d: Date, allDay = false) {
  if (allDay) {
    return d.toISOString().slice(0, 10).replace(/-/g, "");
  }
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export class CalendarService {
  static async exportIcs(
    userId: string,
    projectId: string,
    range: CalendarExportRange = "week",
  ): Promise<string> {
    const project = await projectRepository.findById(projectId);
    if (!project || project.userId !== userId) {
      throw new Error("Project not found");
    }

    const events: IcsEvent[] = [];
    const days = range === "month" ? 30 : 7;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);

      const plan = await studyPlanRepository.findByProjectAndDate(
        projectId,
        date,
      );

      if (plan) {
        const tasks = await studyTaskRepository.listByPlanId(plan.id);
        for (const task of tasks) {
          if (task.status === "SKIPPED") continue;
          const eventStart = new Date(date);
          eventStart.setUTCHours(9, 0, 0, 0);
          const eventEnd = new Date(eventStart);
          eventEnd.setUTCMinutes(eventEnd.getUTCMinutes() + task.estimatedMinutes);

          events.push({
            uid: `learnos-task-${task.id}@learnos.app`,
            title: task.title,
            description: task.taskType,
            start: eventStart,
            end: eventEnd,
          });
        }
      } else {
        const preview = await DailyPlannerService.buildDayPlan(projectId, date);
        for (const task of preview.tasks) {
          const eventStart = new Date(date);
          eventStart.setUTCHours(9, 0, 0, 0);
          const eventEnd = new Date(eventStart);
          eventEnd.setUTCMinutes(eventEnd.getUTCMinutes() + task.estimatedMinutes);
          events.push({
            uid: `learnos-preview-${task.topicId ?? task.type}-${date.toISOString()}@learnos.app`,
            title: task.title,
            description: task.type,
            start: eventStart,
            end: eventEnd,
          });
        }
      }
    }

    const dueCards = await revisionCardRepository.listDueByProject(
      userId,
      projectId,
      20,
    );
    if (dueCards.length > 0) {
      const today = new Date();
      today.setUTCHours(18, 0, 0, 0);
      const end = new Date(today);
      end.setUTCMinutes(end.getUTCMinutes() + 30);
      events.push({
        uid: `learnos-revision-${projectId}@learnos.app`,
        title: `Revision: ${dueCards.length} cards due`,
        description: "Spaced repetition review block",
        start: today,
        end,
      });
    }

    const blueprint = await blueprintRepository.findByProjectId(projectId);
    const dailyCommitment =
      parseDailyCommitmentMinutes(blueprint?.dailyCommitment) ?? 0;

    if (dailyCommitment > 0) {
      const today = new Date();
      today.setUTCHours(8, 0, 0, 0);
      const end = new Date(today);
      end.setUTCMinutes(end.getUTCMinutes() + dailyCommitment);
      events.push({
        uid: `learnos-daily-${projectId}@learnos.app`,
        title: `Daily study: ${project.title}`,
        description: `${dailyCommitment} min commitment`,
        start: today,
        end,
      });
    }

    return this.buildIcs(events, project.title);
  }

  private static buildIcs(events: IcsEvent[], calendarName: string) {
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LearnOS//EN",
      `X-WR-CALNAME:${escapeIcs(calendarName)}`,
      "CALSCALE:GREGORIAN",
    ];

    for (const event of events) {
      lines.push(
        "BEGIN:VEVENT",
        `UID:${event.uid}`,
        `DTSTAMP:${formatIcsDate(new Date())}`,
        event.allDay
          ? `DTSTART;VALUE=DATE:${formatIcsDate(event.start, true)}`
          : `DTSTART:${formatIcsDate(event.start)}`,
        event.allDay
          ? `DTEND;VALUE=DATE:${formatIcsDate(event.end, true)}`
          : `DTEND:${formatIcsDate(event.end)}`,
        `SUMMARY:${escapeIcs(event.title)}`,
        ...(event.description
          ? [`DESCRIPTION:${escapeIcs(event.description)}`]
          : []),
        "END:VEVENT",
      );
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  }
}
