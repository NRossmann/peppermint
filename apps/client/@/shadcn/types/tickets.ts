export type ViewMode = "list" | "kanban";
export type KanbanGrouping = "status" | "priority" | "type" | "assignee";
export type SortOption = "newest" | "oldest" | "priority" | "title";

export type TicketState = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  order: number;
  isResolved: boolean;
};

export type Team = {
  id: string;
  name: string;
};

export type User = {
  id: string;
  name: string;
};

export type Ticket = {
  id: string;
  Number: number;
  title: string;
  detail?: string | null;
  note?: string | null;
  priority: string;
  type: string;
  stateId: string;
  state: TicketState;
  createdAt: string;
  team?: Team;
  assignedTo?: User;
};

export type KanbanColumn = {
  id: string;
  title: string;
  color: string;
  tickets: Ticket[];
  droppable?: boolean;
  order?: number;
  state?: TicketState;
  value?: string;
};

export interface UISettings {
  showAvatars: boolean;
  showDates: boolean;
  showPriority: boolean;
  showType: boolean;
  showTicketNumbers: boolean;
}
