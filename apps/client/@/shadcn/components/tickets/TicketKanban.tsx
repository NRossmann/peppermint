import {
  draggable,
  dropTargetForElements,
} from "@atlaskit/pragmatic-drag-and-drop/element/adapter";
import { combine } from "@atlaskit/pragmatic-drag-and-drop/combine";
import moment from "moment";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  KanbanColumn,
  Ticket,
  TicketState,
  UISettings,
} from "../../types/tickets";

interface TicketKanbanProps {
  columns: KanbanColumn[];
  uiSettings: UISettings;
  onStatusChange: (ticket: Ticket, state: TicketState) => void;
}

interface KanbanColumnLaneProps {
  column: KanbanColumn;
  uiSettings: UISettings;
  draggingTicketId: string | null;
  onDragStart: (ticketId: string) => void;
  onDragEnd: () => void;
  onStatusChange: (ticket: Ticket, state: TicketState) => void;
  ticketLookup: Map<string, Ticket>;
}

function TicketKanbanCard({
  ticket,
  uiSettings,
  draggingTicketId,
  onDragStart,
  onDragEnd,
}: {
  ticket: Ticket;
  uiSettings: UISettings;
  draggingTicketId: string | null;
  onDragStart: (ticketId: string) => void;
  onDragEnd: () => void;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    return combine(
      draggable({
        element,
        dragHandle: element,
        getInitialData: () => ({ ticketId: ticket.id }) as const,
        onDragStart: () => onDragStart(ticket.id),
        onDrop: onDragEnd,
      }),
    );
  }, [onDragEnd, onDragStart, ticket.id]);

  return (
    <div
      ref={elementRef}
      className={`bg-white dark:bg-gray-900 rounded-lg shadow-sm border dark:border-gray-700 p-3 cursor-move hover:shadow-md transition-shadow ${
        draggingTicketId === ticket.id ? "opacity-60" : ""
      }`}
    >
      <div className="flex flex-col gap-2 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-baseline gap-2 min-w-0 flex-1">
            {uiSettings.showTicketNumbers && (
              <span className="text-xs text-gray-500 flex-shrink-0">
                #{ticket.Number}
              </span>
            )}
            <Link
              href={`/issue/${ticket.id}`}
              className="text-sm font-medium hover:underline truncate"
            >
              {ticket.title}
            </Link>
          </div>
          {uiSettings.showAvatars && ticket.assignedTo && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gray-500 flex-shrink-0">
              <span className="text-[11px] font-medium leading-none text-white uppercase">
                {ticket.assignedTo.name[0]}
              </span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-1">
          {uiSettings.showDates && (
            <span className="text-xs text-gray-500 flex-shrink-0">
              {moment(ticket.createdAt).format("DD/MM/yyyy")}
            </span>
          )}

          {uiSettings.showType && (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize bg-orange-400 text-white flex-shrink-0">
              {ticket.type}
            </span>
          )}

          {uiSettings.showPriority && (
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium capitalize flex-shrink-0
              ${
                ticket.priority.toLowerCase() === "high"
                  ? "bg-red-100 text-red-800"
                  : ticket.priority.toLowerCase() === "normal"
                    ? "bg-green-100 text-green-800"
                    : "bg-blue-100 text-blue-800"
              }`}
            >
              {ticket.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketKanbanLane({
  column,
  uiSettings,
  draggingTicketId,
  onDragStart,
  onDragEnd,
  onStatusChange,
  ticketLookup,
}: KanbanColumnLaneProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element || !column.droppable) return;

    return combine(
      dropTargetForElements({
        element,
        canDrop: ({ source }) => {
          const ticketId = source.data.ticketId;
          const ticket =
            typeof ticketId === "string"
              ? ticketLookup.get(ticketId)
              : undefined;

          return (
            !!ticket && !!column.state && ticket.stateId !== column.state.id
          );
        },
        getData: () => ({ columnId: column.id }),
        onDrop: ({ source }) => {
          const ticketId = source.data.ticketId;
          if (typeof ticketId !== "string") return;

          const ticket = ticketLookup.get(ticketId);
          if (!ticket || !column.state || ticket.stateId === column.state.id) {
            return;
          }

          onStatusChange(ticket, column.state);
          onDragEnd();
        },
      }),
    );
  }, [column.droppable, column.id, onDragEnd, onStatusChange, ticketLookup]);

  return (
    <div
      ref={elementRef}
      className="w-[320px] flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-col max-h-[calc(100vh-8rem)]"
    >
      <div className="p-3 border-b dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${column.color}`} />
          <span className="font-medium text-sm truncate">{column.title}</span>
          <span className="text-gray-500 text-xs flex-shrink-0">
            ({column.tickets.length})
          </span>
        </div>
      </div>
      <div className="p-2 pb-4 space-y-2 overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {column.tickets.map((ticket) => (
          <TicketKanbanCard
            key={ticket.id}
            ticket={ticket}
            uiSettings={uiSettings}
            draggingTicketId={draggingTicketId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
}

export default function TicketKanban({
  columns,
  uiSettings,
  onStatusChange,
}: TicketKanbanProps) {
  const [draggingTicketId, setDraggingTicketId] = useState<string | null>(null);

  useEffect(() => {
    setDraggingTicketId(null);
  }, [columns]);

  const ticketLookup = new Map(
    columns.flatMap((column) =>
      column.tickets.map((ticket) => [ticket.id, ticket] as const),
    ),
  );

  return (
    <div className="flex-1 min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <div className="flex gap-4 p-4 min-w-fit max-w-[calc(100vw-2rem)]">
        {columns.map((column) => (
          <TicketKanbanLane
            key={column.id}
            column={column}
            uiSettings={uiSettings}
            draggingTicketId={draggingTicketId}
            onDragStart={setDraggingTicketId}
            onDragEnd={() => setDraggingTicketId(null)}
            onStatusChange={onStatusChange}
            ticketLookup={ticketLookup}
          />
        ))}
      </div>
    </div>
  );
}
