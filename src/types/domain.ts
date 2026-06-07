export type Activity = {
  id: string;
  name: string;
  color: string;
  isPreset: boolean;
  createdAt: string;
};

export type CalendarEntry = {
  id: string;
  entryDate: string;
  title: string;
  note?: string;
  activityId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateEntryInput = {
  entryDate: string;
  title: string;
  note?: string;
  activityId?: string;
};

export type UpdateEntryInput = {
  title?: string;
  note?: string;
  activityId?: string;
};

export type CreateActivityInput = {
  name: string;
  color: string;
  isPreset?: boolean;
};

export type UpdateActivityInput = {
  name?: string;
  color?: string;
};
