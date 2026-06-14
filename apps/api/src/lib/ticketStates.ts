import { prisma } from "../prisma";

export const DEFAULT_TICKET_STATE_SLUG = "needs_support";
export const DEFAULT_RESOLVED_TICKET_STATE_SLUG = "done";

export const ticketStateSelect = {
  id: true,
  name: true,
  slug: true,
  color: true,
  order: true,
  isResolved: true,
} as const;

export function slugifyTicketState(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");
}

export async function getDefaultTicketState() {
  return prisma.ticketState.findFirst({
    where: { slug: DEFAULT_TICKET_STATE_SLUG },
    select: ticketStateSelect,
  });
}

export async function getTicketStateForResolution(isResolved: boolean) {
  const preferredSlug = isResolved
    ? DEFAULT_RESOLVED_TICKET_STATE_SLUG
    : DEFAULT_TICKET_STATE_SLUG;

  const preferredState = await prisma.ticketState.findFirst({
    where: { slug: preferredSlug, isResolved },
    select: ticketStateSelect,
  });

  if (preferredState) {
    return preferredState;
  }

  return prisma.ticketState.findFirst({
    where: { isResolved },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    select: ticketStateSelect,
  });
}

export async function resolveTicketStateIdentifier(input: {
  stateId?: string | null;
  status?: string | null;
}) {
  if (input.stateId) {
    return prisma.ticketState.findUnique({
      where: { id: input.stateId },
      select: ticketStateSelect,
    });
  }

  if (input.status) {
    return prisma.ticketState.findFirst({
      where: { slug: input.status },
      select: ticketStateSelect,
    });
  }

  return null;
}

export function serializeTicketState(state: any) {
  if (!state) return null;

  return {
    id: state.id,
    name: state.name,
    slug: state.slug,
    color: state.color,
    order: state.order,
    isResolved: state.isResolved,
  };
}

export function serializeTicket(ticket: any) {
  const state = serializeTicketState(ticket.state);

  return {
    ...ticket,
    state,
    stateId: ticket.stateId,
    status: state?.slug || null,
    isComplete: state?.isResolved || false,
  };
}
