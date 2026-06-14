import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { isEffectiveAdmin, requirePermission } from "../lib/roles";
import {
  serializeTicketState,
  slugifyTicketState,
  ticketStateSelect,
} from "../lib/ticketStates";
import { checkSession } from "../lib/session";
import { prisma } from "../prisma";

async function validateStateCoverage(
  reply: FastifyReply,
  nextResolvedState: boolean,
  stateId?: string,
) {
  const [resolvedCount, unresolvedCount] = await Promise.all([
    prisma.ticketState.count({
      where: {
        isResolved: true,
        ...(stateId ? { id: { not: stateId } } : {}),
      },
    }),
    prisma.ticketState.count({
      where: {
        isResolved: false,
        ...(stateId ? { id: { not: stateId } } : {}),
      },
    }),
  ]);

  const nextResolvedCount = resolvedCount + (nextResolvedState ? 1 : 0);
  const nextUnresolvedCount = unresolvedCount + (nextResolvedState ? 0 : 1);

  if (nextResolvedCount === 0 || nextUnresolvedCount === 0) {
    return reply.status(400).send({
      success: false,
      message: "At least one open state and one resolved state are required",
    });
  }

  return null;
}

export function ticketStateRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/api/v1/ticket-states",
    {
      preHandler: requirePermission(["issue::read"]),
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const states = await prisma.ticketState.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        select: ticketStateSelect,
      });

      reply.send({ success: true, states: states.map(serializeTicketState) });
    },
  );

  fastify.post(
    "/api/v1/ticket-states",
    {
      preHandler: requirePermission(["settings::manage"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await checkSession(request);
      const sessionWithRoles = session
        ? await prisma.user.findUnique({
            where: { id: session.id },
            include: { roles: true },
          })
        : null;

      if (!isEffectiveAdmin(sessionWithRoles)) {
        return reply
          .status(403)
          .send({ success: false, message: "Unauthorized" });
      }

      const { name, slug, color, order, isResolved }: any = request.body;
      const nextSlug = slugifyTicketState(slug || name || "");

      if (!name || !nextSlug) {
        return reply.status(400).send({
          success: false,
          message: "Name and slug are required",
        });
      }

      const state = await prisma.ticketState.create({
        data: {
          name,
          slug: nextSlug,
          color: color || null,
          order: typeof order === "number" ? order : 0,
          isResolved: Boolean(isResolved),
        },
        select: ticketStateSelect,
      });

      reply.send({ success: true, state: serializeTicketState(state) });
    },
  );

  fastify.put(
    "/api/v1/ticket-states/:id",
    {
      preHandler: requirePermission(["settings::manage"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await checkSession(request);
      const sessionWithRoles = session
        ? await prisma.user.findUnique({
            where: { id: session.id },
            include: { roles: true },
          })
        : null;

      if (!isEffectiveAdmin(sessionWithRoles)) {
        return reply
          .status(403)
          .send({ success: false, message: "Unauthorized" });
      }

      const { id }: any = request.params;
      const { name, slug, color, order, isResolved }: any = request.body;
      const nextSlug = slugifyTicketState(slug || name || "");

      if (!name || !nextSlug) {
        return reply.status(400).send({
          success: false,
          message: "Name and slug are required",
        });
      }

      const existingState = await prisma.ticketState.findUnique({
        where: { id },
        select: { id: true, isResolved: true, slug: true },
      });

      if (!existingState) {
        return reply.status(404).send({
          success: false,
          message: "State not found",
        });
      }

      const coverageError = await validateStateCoverage(
        reply,
        Boolean(isResolved),
        id,
      );

      if (coverageError) {
        return coverageError;
      }

      const state = await prisma.ticketState.update({
        where: { id },
        data: {
          name,
          slug: nextSlug,
          color: color || null,
          order: typeof order === "number" ? order : 0,
          isResolved: Boolean(isResolved),
        },
        select: ticketStateSelect,
      });

      reply.send({ success: true, state: serializeTicketState(state) });
    },
  );

  fastify.delete(
    "/api/v1/ticket-states/:id",
    {
      preHandler: requirePermission(["settings::manage"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const session = await checkSession(request);
      const sessionWithRoles = session
        ? await prisma.user.findUnique({
            where: { id: session.id },
            include: { roles: true },
          })
        : null;

      if (!isEffectiveAdmin(sessionWithRoles)) {
        return reply
          .status(403)
          .send({ success: false, message: "Unauthorized" });
      }

      const { id }: any = request.params;
      const state = await prisma.ticketState.findUnique({
        where: { id },
        select: { id: true, isResolved: true, slug: true },
      });

      if (!state) {
        return reply.status(404).send({
          success: false,
          message: "State not found",
        });
      }

      const ticketsUsingState = await prisma.ticket.count({
        where: { stateId: id },
      });

      if (ticketsUsingState > 0) {
        return reply.status(400).send({
          success: false,
          message: "State is still assigned to tickets",
        });
      }

      const coverageError = await validateStateCoverage(
        reply,
        !state.isResolved,
        id,
      );

      if (coverageError) {
        return coverageError;
      }

      await prisma.ticketState.delete({ where: { id } });

      reply.send({ success: true });
    },
  );
}
