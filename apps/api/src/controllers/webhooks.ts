import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { track } from "../lib/hog";
import {
  buildNtfyUrl,
  buildWebhookConfig,
  serializeWebhookForClient,
} from "../lib/notifications/webhook";
import { requirePermission } from "../lib/roles";
import { checkSession } from "../lib/session";
import { prisma } from "../prisma";

export function webhookRoutes(fastify: FastifyInstance) {
  // Create a new webhook
  fastify.post(
    "/api/v1/webhook/create",
    {
      preHandler: requirePermission(["webhook::create"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = await checkSession(request);
      const {
        name,
        url,
        type,
        active,
        secret,
        provider,
        ntfyServerUrl,
        ntfyTopic,
        ntfyAuthType,
        ntfyUsername,
        ntfyPassword,
        ntfyToken,
      }: any = request.body;

      if (provider === "ntfy") {
        if (!ntfyServerUrl || !ntfyTopic) {
          return reply.status(400).send({
            success: false,
            message: "ntfy server URL and topic are required.",
          });
        }

        if (
          ntfyAuthType === "basic" &&
          (!ntfyUsername || !ntfyPassword)
        ) {
          return reply.status(400).send({
            success: false,
            message: "Username and password are required for ntfy basic auth.",
          });
        }

        if (ntfyAuthType === "token" && !ntfyToken) {
          return reply.status(400).send({
            success: false,
            message: "A token is required for ntfy token auth.",
          });
        }
      } else if (!url) {
        return reply.status(400).send({
          success: false,
          message: "A payload URL is required for generic webhooks.",
        });
      }

      await prisma.webhooks.create({
        data: {
          name,
          url:
            provider === "ntfy"
              ? buildNtfyUrl(ntfyServerUrl, ntfyTopic)
              : url,
          type,
          active,
          secret: buildWebhookConfig({
            provider: provider === "ntfy" ? "ntfy" : "generic",
            secret,
            serverUrl: ntfyServerUrl,
            topic: ntfyTopic,
            authType: ntfyAuthType,
            username: ntfyUsername,
            password: ntfyPassword,
            token: ntfyToken,
          }),
          createdBy: user!.id,
        },
      });

      const client = track();

      client.capture({
        event: "webhook_created",
        distinctId: "uuid",
      });

      client.shutdownAsync();

      reply.status(200).send({ message: "Hook created!", success: true });
    }
  );

  // Get all webhooks
  fastify.get(
    "/api/v1/webhooks/all",
    {
      preHandler: requirePermission(["webhook::read"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const webhooks = await prisma.webhooks.findMany({});

      reply.status(200).send({
        webhooks: webhooks.map(serializeWebhookForClient),
        success: true,
      });
    }
  );

  // Delete a webhook
  fastify.delete(
    "/api/v1/admin/webhook/:id/delete",
    {
      preHandler: requirePermission(["webhook::delete"]),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id }: any = request.params;
      await prisma.webhooks.delete({
        where: {
          id: id,
        },
      });

      reply.status(200).send({ success: true });
    }
  );
}
