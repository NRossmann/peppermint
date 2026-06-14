import {
  KanbanColumn,
  KanbanGrouping,
  SortOption,
  Ticket,
  TicketState,
  UISettings,
  User,
  ViewMode,
} from "@/shadcn/types/tickets";
import { useEffect, useState } from "react";

const priorityColorMap: Record<string, string> = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  normal: "bg-green-500",
  low: "bg-blue-500",
};

const typeColorMap: Record<string, string> = {
  bug: "bg-red-500",
  feature: "bg-blue-500",
  support: "bg-green-500",
  incident: "bg-rose-500",
  service: "bg-cyan-500",
  maintenance: "bg-amber-500",
  access: "bg-violet-500",
  feedback: "bg-orange-500",
};

function titleize(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function useTicketView(
  tickets: Ticket[] = [],
  availableStates: TicketState[] = [],
  availableUsers: User[] = [],
) {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("preferred_view_mode");
    return (saved as ViewMode) || "list";
  });

  const [kanbanGrouping, setKanbanGrouping] = useState<KanbanGrouping>(() => {
    const saved = localStorage.getItem("preferred_kanban_grouping");
    return (saved as KanbanGrouping) || "status";
  });

  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const saved = localStorage.getItem("preferred_sort_by");
    return (saved as SortOption) || "newest";
  });

  const [uiSettings, setUISettings] = useState<UISettings>(() => {
    const saved = localStorage.getItem("preferred_ui_settings");
    return saved
      ? JSON.parse(saved)
      : {
          showAvatars: true,
          showDates: true,
          showPriority: true,
          showType: true,
          showTicketNumbers: true,
        };
  });

  useEffect(() => {
    localStorage.setItem("preferred_view_mode", viewMode);
    localStorage.setItem("preferred_kanban_grouping", kanbanGrouping);
    localStorage.setItem("preferred_sort_by", sortBy);
    localStorage.setItem("preferred_ui_settings", JSON.stringify(uiSettings));
  }, [viewMode, kanbanGrouping, sortBy, uiSettings]);

  const handleUISettingChange = (setting: keyof UISettings, value: boolean) => {
    setUISettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const sortedTickets = [...tickets].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "priority":
        const priorityOrder = { high: 0, normal: 1, low: 2 };
        return (
          priorityOrder[a.priority.toLowerCase()] -
          priorityOrder[b.priority.toLowerCase()]
        );
      case "title":
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const kanbanColumns = (() => {
    switch (kanbanGrouping) {
      case "status":
        return availableStates
          .map((state) => ({
            id: state.slug,
            title: state.name,
            color: state.color || "bg-gray-500",
            tickets: sortedTickets.filter(
              (ticket) => ticket.stateId === state.id,
            ),
            droppable: true,
            order: state.order,
            state,
          }))
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(({ order, ...column }) => column)
          .filter((column, index, columns) => {
            return columns.findIndex((item) => item.id === column.id) === index;
          });

      case "priority":
        const priorityOrder = ["high", "medium", "normal", "low"];
        const priorities = Array.from(
          new Set([
            ...priorityOrder,
            ...sortedTickets.map((t) => t.priority.toLowerCase()),
          ]),
        ).sort((a, b) => {
          const aIndex = priorityOrder.indexOf(a);
          const bIndex = priorityOrder.indexOf(b);
          const normalizedA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
          const normalizedB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
          return normalizedA - normalizedB || a.localeCompare(b);
        });

        return priorities.map((priority) => ({
          id: priority,
          title: titleize(priority),
          color: priorityColorMap[priority] || "bg-slate-500",
          tickets: sortedTickets.filter(
            (t) => t.priority.toLowerCase() === priority,
          ),
          droppable: true,
          value: priority,
        }));
      case "type":
        return Array.from(
          new Set([
            ...Object.keys(typeColorMap),
            ...sortedTickets.map((t) => t.type),
          ]),
        ).map((type) => ({
          id: type,
          title: titleize(type),
          color: typeColorMap[type] || "bg-slate-500",
          tickets: sortedTickets.filter((t) => t.type === type),
          droppable: true,
          value: type,
        }));
      case "assignee":
        const assignees = Array.from(
          new Set([
            "Unassigned",
            ...availableUsers.map((user) => user.name),
            ...sortedTickets.map((t) => t.assignedTo?.name || "Unassigned"),
          ]),
        );
        return assignees.map((assignee) => ({
          id: assignee.toLowerCase(),
          title: assignee,
          color: "bg-teal-500",
          tickets: sortedTickets.filter(
            (t) => (t.assignedTo?.name || "Unassigned") === assignee,
          ),
          droppable: true,
          value: assignee === "Unassigned" ? "" : assignee,
        }));
      default:
        return [];
    }
  })();

  return {
    viewMode,
    kanbanGrouping,
    sortBy,
    setViewMode,
    setKanbanGrouping,
    setSortBy,
    sortedTickets,
    kanbanColumns,
    uiSettings,
    handleUISettingChange,
  };
}
