import TicketFilters from "@/shadcn/components/tickets/TicketFilters";
import TicketKanban from "@/shadcn/components/tickets/TicketKanban";
import TicketList from "@/shadcn/components/tickets/TicketList";
import ViewSettings from "@/shadcn/components/tickets/ViewSettings";
import { useTicketActions } from "@/shadcn/hooks/useTicketActions";
import { useTicketFilters } from "@/shadcn/hooks/useTicketFilters";
import { useTicketView } from "@/shadcn/hooks/useTicketView";
import { TicketState } from "@/shadcn/types/tickets";
import { getCookie } from "cookies-next";
import { Loader } from "lucide-react";
import useTranslation from "next-translate/useTranslation";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { useUser } from "../../store/session";

async function getUserTickets(token: any) {
  const res = await fetch(`/api/v1/tickets/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
}

export default function Tickets() {
  const router = useRouter();
  const { t } = useTranslation("peppermint");

  const token = getCookie("session");
  const user = useUser();
  const [users, setUsers] = useState<any[]>([]);
  const [states, setStates] = useState<TicketState[]>([]);

  // Fetch tickets data
  const { data, status, refetch } = useQuery(
    "allusertickets",
    () => getUserTickets(token),
    {
      refetchInterval: 5000,
    },
  );

  // Custom hooks for managing state
  const {
    selectedPriorities,
    selectedStatuses,
    selectedAssignees,
    handlePriorityToggle,
    handleStatusToggle,
    handleAssigneeToggle,
    clearFilters,
    filteredTickets,
  } = useTicketFilters(data?.tickets);

  const {
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
  } = useTicketView(filteredTickets, states, users);

  const {
    updateTicketStatus,
    updateTicketKanbanStatus,
    updateTicketKanbanGrouping,
    updateTicketAssignee,
    updateTicketPriority,
    deleteTicket,
  } = useTicketActions(token, refetch);

  const handleKanbanDrop = (ticket, column) => {
    if (kanbanGrouping === "status") {
      if (!column.state) return;
      return updateTicketKanbanStatus(ticket, column.state);
    }

    if (!column.value && kanbanGrouping !== "assignee") {
      return;
    }

    return updateTicketKanbanGrouping(
      kanbanGrouping,
      ticket,
      column.value || "",
      users,
    );
  };

  // Update local storage when filters change
  useEffect(() => {
    localStorage.setItem(
      "all_selectedPriorities",
      JSON.stringify(selectedPriorities),
    );
    localStorage.setItem(
      "all_selectedStatuses",
      JSON.stringify(selectedStatuses),
    );
    localStorage.setItem(
      "all_selectedAssignees",
      JSON.stringify(selectedAssignees),
    );
  }, [selectedPriorities, selectedStatuses, selectedAssignees]);

  const statusOptions: string[] = states.map((state) => state.name);

  async function fetchUsers() {
    await fetch(`/api/v1/users/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res) {
          setUsers(res.users);
        }
      });
  }

  async function fetchStates() {
    await fetch(`/api/v1/ticket-states`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setStates(res.states || []);
        }
      });
  }

  useEffect(() => {
    fetchUsers();
    fetchStates();
  }, []);

  // Add this to the useEffect that saves preferences
  useEffect(() => {
    localStorage.setItem("preferred_view_mode", viewMode);
    localStorage.setItem("preferred_kanban_grouping", kanbanGrouping);
    localStorage.setItem("preferred_sort_by", sortBy);
  }, [viewMode, kanbanGrouping, sortBy]);

  if (status === "loading") {
    return <Loader className="animate-spin" />;
  }

  return (
    <div className="flex flex-col h-screen min-w-0 overflow-hidden">
      <div className="sticky top-0 z-20 bg-background border-b-[1px] shrink-0">
        <div className="py-2 px-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <TicketFilters
                selectedPriorities={selectedPriorities}
                selectedStatuses={selectedStatuses}
                statusOptions={statusOptions}
                selectedAssignees={selectedAssignees}
                users={users}
                onPriorityToggle={handlePriorityToggle}
                onStatusToggle={handleStatusToggle}
                onAssigneeToggle={handleAssigneeToggle}
                onClearFilters={clearFilters}
              />
            </div>

            <div className="shrink-0 self-start ml-auto">
              <ViewSettings
                viewMode={viewMode}
                kanbanGrouping={kanbanGrouping}
                sortBy={sortBy}
                uiSettings={uiSettings}
                onViewModeChange={setViewMode}
                onKanbanGroupingChange={setKanbanGrouping}
                onSortChange={setSortBy}
                onUISettingChange={handleUISettingChange}
              />
            </div>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <TicketList
          tickets={sortedTickets}
          onStatusChange={updateTicketStatus}
          onAssigneeChange={updateTicketAssignee}
          onPriorityChange={updateTicketPriority}
          onDelete={user.isAdmin ? deleteTicket : undefined}
          users={users}
          currentUser={user}
          uiSettings={uiSettings}
        />
      ) : (
        <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <TicketKanban
            columns={kanbanColumns}
            uiSettings={uiSettings}
            grouping={kanbanGrouping}
            onColumnDrop={handleKanbanDrop}
          />
        </div>
      )}
    </div>
  );
}
