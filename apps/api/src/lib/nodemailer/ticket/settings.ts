import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma";

export type TicketCreatedRule = {
  enabled: boolean;
  onInternalTicketCreate: boolean;
  onPublicTicketCreate: boolean;
};

export type TicketAssignedRule = {
  enabled: boolean;
  onTicketCreationAssignment: boolean;
  onTicketTransferAssignment: boolean;
};

export type TicketCommentRule = {
  enabled: boolean;
  onPublicComment: boolean;
};

export type TicketStatusRule = {
  enabled: boolean;
  trigger: "resolved_only" | "any_state_change";
};

export type EmailTemplateSettings = {
  ticket_created: TicketCreatedRule;
  ticket_assigned: TicketAssignedRule;
  ticket_comment: TicketCommentRule;
  ticket_status_changed: TicketStatusRule;
};

export const defaultEmailTemplateSettings: EmailTemplateSettings = {
  ticket_created: {
    enabled: true,
    onInternalTicketCreate: true,
    onPublicTicketCreate: true,
  },
  ticket_assigned: {
    enabled: true,
    onTicketCreationAssignment: true,
    onTicketTransferAssignment: true,
  },
  ticket_comment: {
    enabled: true,
    onPublicComment: true,
  },
  ticket_status_changed: {
    enabled: true,
    trigger: "resolved_only",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asStatusTrigger(
  value: unknown,
  fallback: TicketStatusRule["trigger"]
): TicketStatusRule["trigger"] {
  return value === "resolved_only" || value === "any_state_change"
    ? value
    : fallback;
}

export function normalizeEmailTemplateSettings(
  value: Prisma.JsonValue | unknown
): EmailTemplateSettings {
  const raw = isObject(value) ? value : {};

  const rawTicketCreated = isObject(raw.ticket_created)
    ? raw.ticket_created
    : {};
  const rawTicketAssigned = isObject(raw.ticket_assigned)
    ? raw.ticket_assigned
    : {};
  const rawTicketComment = isObject(raw.ticket_comment)
    ? raw.ticket_comment
    : {};
  const rawTicketStatus = isObject(raw.ticket_status_changed)
    ? raw.ticket_status_changed
    : {};

  return {
    ticket_created: {
      enabled: asBoolean(
        rawTicketCreated.enabled,
        defaultEmailTemplateSettings.ticket_created.enabled
      ),
      onInternalTicketCreate: asBoolean(
        rawTicketCreated.onInternalTicketCreate,
        defaultEmailTemplateSettings.ticket_created.onInternalTicketCreate
      ),
      onPublicTicketCreate: asBoolean(
        rawTicketCreated.onPublicTicketCreate,
        defaultEmailTemplateSettings.ticket_created.onPublicTicketCreate
      ),
    },
    ticket_assigned: {
      enabled: asBoolean(
        rawTicketAssigned.enabled,
        defaultEmailTemplateSettings.ticket_assigned.enabled
      ),
      onTicketCreationAssignment: asBoolean(
        rawTicketAssigned.onTicketCreationAssignment,
        defaultEmailTemplateSettings.ticket_assigned.onTicketCreationAssignment
      ),
      onTicketTransferAssignment: asBoolean(
        rawTicketAssigned.onTicketTransferAssignment,
        defaultEmailTemplateSettings.ticket_assigned.onTicketTransferAssignment
      ),
    },
    ticket_comment: {
      enabled: asBoolean(
        rawTicketComment.enabled,
        defaultEmailTemplateSettings.ticket_comment.enabled
      ),
      onPublicComment: asBoolean(
        rawTicketComment.onPublicComment,
        defaultEmailTemplateSettings.ticket_comment.onPublicComment
      ),
    },
    ticket_status_changed: {
      enabled: asBoolean(
        rawTicketStatus.enabled,
        defaultEmailTemplateSettings.ticket_status_changed.enabled
      ),
      trigger: asStatusTrigger(
        rawTicketStatus.trigger,
        defaultEmailTemplateSettings.ticket_status_changed.trigger
      ),
    },
  };
}

export async function getEmailTemplateSettings() {
  const config = await prisma.config.findFirst({
    select: {
      notifications: true,
    },
  });

  const notifications =
    config?.notifications &&
    typeof config.notifications === "object" &&
    !Array.isArray(config.notifications)
      ? config.notifications
      : {};

  return normalizeEmailTemplateSettings(
    (notifications as Record<string, unknown>).emailTemplates
  );
}

export function shouldSendTicketCreatedEmail(
  settings: EmailTemplateSettings,
  source: "internal" | "public"
) {
  if (!settings.ticket_created.enabled) {
    return false;
  }

  return source === "public"
    ? settings.ticket_created.onPublicTicketCreate
    : settings.ticket_created.onInternalTicketCreate;
}

export function shouldSendTicketAssignedEmail(
  settings: EmailTemplateSettings,
  trigger: "create" | "transfer"
) {
  if (!settings.ticket_assigned.enabled) {
    return false;
  }

  return trigger === "create"
    ? settings.ticket_assigned.onTicketCreationAssignment
    : settings.ticket_assigned.onTicketTransferAssignment;
}

export function shouldSendTicketCommentEmail(settings: EmailTemplateSettings) {
  return (
    settings.ticket_comment.enabled && settings.ticket_comment.onPublicComment
  );
}

export function shouldSendTicketStatusEmail(
  settings: EmailTemplateSettings,
  event: { isResolutionChange: boolean; isStateChange: boolean }
) {
  if (!settings.ticket_status_changed.enabled) {
    return false;
  }

  if (settings.ticket_status_changed.trigger === "any_state_change") {
    return event.isStateChange;
  }

  return event.isResolutionChange;
}
