export type CalendarExportRange = "week" | "month";

export type IcsEvent = {
  uid: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
};
