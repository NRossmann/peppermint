type TicketLike = {
  id?: string;
  Number?: number;
  title?: string;
  priority?: string;
  email?: string | null;
  name?: string | null;
  state?: {
    name?: string | null;
  } | null;
  assignedTo?: {
    name?: string | null;
  } | null;
  createdBy?: {
    name?: string | null;
    email?: string | null;
  } | null;
};

function getBaseUrl() {
  return (
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    process.env.BASE_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function buildTicketTemplateContext(
  ticket: TicketLike,
  overrides: Partial<Record<string, string>> = {},
) {
  const requester =
    ticket.createdBy?.name ||
    ticket.name ||
    ticket.email ||
    "Unknown requester";
  const ticketId = ticket.Number ? String(ticket.Number) : ticket.id || "";

  return {
    id: ticketId,
    title: ticket.title || "",
    status: ticket.state?.name || "",
    comment: "",
    ticket_url: ticket.id ? `${getBaseUrl()}/issue/${ticket.id}` : "",
    assignedTo: ticket.assignedTo?.name || "Unassigned",
    ticket_priority: ticket.priority || "",
    ticket_requester: requester,
    ...overrides,
  };
}
