import { KanbanGrouping, Ticket, TicketState } from "@/shadcn/types/tickets";
import { toast } from "../hooks/use-toast";

export function useTicketActions(token: string, refetch: () => void) {
  const updateTicketKanbanStatus = async (
    ticket: Ticket,
    state: TicketState,
  ) => {
    try {
      const response = await fetch(`/api/v1/ticket/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: ticket.id,
          detail: ticket.detail,
          note: ticket.note,
          title: ticket.title,
          priority: ticket.priority,
          stateId: state.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to update ticket status");

      toast({
        title: "Status updated",
        description: "The issue was moved successfully.",
        duration: 3000,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move issue",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateTicketStatus = async (ticket: Ticket) => {
    try {
      const response = await fetch(`/api/v1/ticket/state/update`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: ticket.id,
          resolved: !ticket.state?.isResolved,
        }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      toast({
        title: ticket.state?.isResolved ? "Issue re-opened" : "Issue closed",
        description: "The status of the issue has been updated.",
        duration: 3000,
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateTicketAssignee = async (ticketId: string, userId?: string) => {
    try {
      const response = await fetch(`/api/v1/ticket/transfer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: userId,
          id: ticketId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update assignee");

      toast({
        title: "Assignee updated",
        description: `Transferred issue successfully`,
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignee",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateTicketPriority = async (ticket: Ticket, priority: string) => {
    try {
      const response = await fetch(`/api/v1/ticket/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: ticket.id,
          detail: ticket.detail,
          note: ticket.note,
          title: ticket.title,
          priority: priority,
          stateId: ticket.stateId,
        }),
      });

      if (!response.ok) throw new Error("Failed to update priority");

      toast({
        title: "Priority updated",
        description: `Ticket priority set to ${priority}`,
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateTicketType = async (ticket: Ticket, type: string) => {
    try {
      const response = await fetch(`/api/v1/ticket/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: ticket.id,
          detail: ticket.detail,
          note: ticket.note,
          title: ticket.title,
          priority: ticket.priority,
          stateId: ticket.stateId,
          type,
        }),
      });

      if (!response.ok) throw new Error("Failed to update type");

      toast({
        title: "Type updated",
        description: `Ticket type set to ${type}`,
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update type",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const updateTicketKanbanGrouping = async (
    grouping: KanbanGrouping,
    ticket: Ticket,
    value: string,
    users: Array<{ id: string; name: string }> = [],
  ) => {
    switch (grouping) {
      case "status":
        return;
      case "priority":
        return updateTicketPriority(ticket, value);
      case "type":
        return updateTicketType(ticket, value);
      case "assignee": {
        const matchedUser = users.find((user) => user.name === value);
        return updateTicketAssignee(ticket.id, matchedUser?.id);
      }
      default:
        return;
    }
  };

  const deleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/v1/ticket/delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: ticketId }),
      });

      if (!response.ok) throw new Error("Failed to delete ticket");

      toast({
        title: "Ticket deleted",
        description: "The ticket has been deleted successfully",
        duration: 3000,
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete ticket",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  return {
    updateTicketStatus,
    updateTicketKanbanStatus,
    updateTicketKanbanGrouping,
    updateTicketAssignee,
    updateTicketPriority,
    updateTicketType,
    deleteTicket,
  };
}
