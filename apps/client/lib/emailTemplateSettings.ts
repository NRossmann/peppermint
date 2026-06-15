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

export type TemplateType =
  | "ticket_created"
  | "ticket_assigned"
  | "ticket_comment"
  | "ticket_status_changed";

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

type TemplateMetadata = {
  label: string;
  recipient: string;
  description: string;
  variables: string[];
};

const sharedTicketVariables = [
  "{{id}}",
  "{{title}}",
  "{{status}}",
  "{{comment}}",
  "{{ticket_url}}",
  "{{assignedTo}}",
  "{{ticket_priority}}",
  "{{ticket_requester}}",
];

export const emailTemplateMetadata: Record<TemplateType, TemplateMetadata> = {
  ticket_created: {
    label: "Ticket created",
    recipient: "Requester",
    description:
      "Confirmation email for the requester after a ticket is created and a valid requester email exists.",
    variables: sharedTicketVariables,
  },
  ticket_assigned: {
    label: "Ticket assigned",
    recipient: "Assigned agent",
    description:
      "Notification email for the assignee when a ticket gets assigned during creation or transfer.",
    variables: sharedTicketVariables,
  },
  ticket_comment: {
    label: "Public comment",
    recipient: "Requester",
    description:
      "Notification email for the requester when an internal user adds a public comment to the ticket.",
    variables: sharedTicketVariables,
  },
  ticket_status_changed: {
    label: "Ticket status changed",
    recipient: "Requester",
    description:
      "Notification email for the requester when the ticket state changes according to the selected trigger rule.",
    variables: sharedTicketVariables,
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function asTrigger(
  value: unknown,
  fallback: TicketStatusRule["trigger"]
): TicketStatusRule["trigger"] {
  return value === "resolved_only" || value === "any_state_change"
    ? value
    : fallback;
}

export function normalizeEmailTemplateSettings(
  value: unknown
): EmailTemplateSettings {
  const raw = isObject(value) ? value : {};
  const created = isObject(raw.ticket_created) ? raw.ticket_created : {};
  const assigned = isObject(raw.ticket_assigned) ? raw.ticket_assigned : {};
  const comment = isObject(raw.ticket_comment) ? raw.ticket_comment : {};
  const status = isObject(raw.ticket_status_changed)
    ? raw.ticket_status_changed
    : {};

  return {
    ticket_created: {
      enabled: asBoolean(
        created.enabled,
        defaultEmailTemplateSettings.ticket_created.enabled
      ),
      onInternalTicketCreate: asBoolean(
        created.onInternalTicketCreate,
        defaultEmailTemplateSettings.ticket_created.onInternalTicketCreate
      ),
      onPublicTicketCreate: asBoolean(
        created.onPublicTicketCreate,
        defaultEmailTemplateSettings.ticket_created.onPublicTicketCreate
      ),
    },
    ticket_assigned: {
      enabled: asBoolean(
        assigned.enabled,
        defaultEmailTemplateSettings.ticket_assigned.enabled
      ),
      onTicketCreationAssignment: asBoolean(
        assigned.onTicketCreationAssignment,
        defaultEmailTemplateSettings.ticket_assigned.onTicketCreationAssignment
      ),
      onTicketTransferAssignment: asBoolean(
        assigned.onTicketTransferAssignment,
        defaultEmailTemplateSettings.ticket_assigned.onTicketTransferAssignment
      ),
    },
    ticket_comment: {
      enabled: asBoolean(
        comment.enabled,
        defaultEmailTemplateSettings.ticket_comment.enabled
      ),
      onPublicComment: asBoolean(
        comment.onPublicComment,
        defaultEmailTemplateSettings.ticket_comment.onPublicComment
      ),
    },
    ticket_status_changed: {
      enabled: asBoolean(
        status.enabled,
        defaultEmailTemplateSettings.ticket_status_changed.enabled
      ),
      trigger: asTrigger(
        status.trigger,
        defaultEmailTemplateSettings.ticket_status_changed.trigger
      ),
    },
  };
}

export function getTemplateTriggerSummary(
  type: TemplateType,
  settings: EmailTemplateSettings
) {
  switch (type) {
    case "ticket_created": {
      if (!settings.ticket_created.enabled) {
        return "Disabled";
      }

      const triggers = [];

      if (settings.ticket_created.onInternalTicketCreate) {
        triggers.push("internal ticket creation");
      }

      if (settings.ticket_created.onPublicTicketCreate) {
        triggers.push("public ticket creation");
      }

      return triggers.length > 0
        ? `Sent on ${triggers.join(" and ")}`
        : "Enabled, but no creation trigger is selected";
    }
    case "ticket_assigned": {
      if (!settings.ticket_assigned.enabled) {
        return "Disabled";
      }

      const triggers = [];

      if (settings.ticket_assigned.onTicketCreationAssignment) {
        triggers.push("assignment during ticket creation");
      }

      if (settings.ticket_assigned.onTicketTransferAssignment) {
        triggers.push("reassignment / transfer");
      }

      return triggers.length > 0
        ? `Sent on ${triggers.join(" and ")}`
        : "Enabled, but no assignment trigger is selected";
    }
    case "ticket_comment":
      return settings.ticket_comment.enabled
        ? "Sent when a public comment is posted"
        : "Disabled";
    case "ticket_status_changed":
      if (!settings.ticket_status_changed.enabled) {
        return "Disabled";
      }

      return settings.ticket_status_changed.trigger === "any_state_change"
        ? "Sent on every ticket state change"
        : "Sent only when the ticket changes between open and resolved";
    default:
      return "Disabled";
  }
}
