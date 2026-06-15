import axios from "axios";

function getPriorityColor(priority: string): number {
  switch (priority.toLowerCase()) {
    case "high":
      return 16711680; // Red
    case "medium":
      return 16753920; // Orange
    case "low":
      return 65280; // Green
    default:
      return 8421504; // Grey
  }
}

type NtfyAuthType = "none" | "basic" | "token";

type StoredWebhookConfig =
  | {
      provider: "generic";
      secret?: string | null;
    }
  | {
      provider: "ntfy";
      serverUrl: string;
      topic: string;
      authType: NtfyAuthType;
      username?: string;
      password?: string;
      token?: string;
    };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeServerUrl(serverUrl: string) {
  return serverUrl.trim().replace(/\/+$/, "");
}

function normalizeTopic(topic: string) {
  return topic
    .trim()
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function buildNtfyUrl(serverUrl: string, topic: string) {
  return `${normalizeServerUrl(serverUrl)}/${normalizeTopic(topic)}`;
}

export function parseWebhookConfig(secret?: string | null): StoredWebhookConfig {
  if (!secret) {
    return {
      provider: "generic",
      secret: null,
    };
  }

  try {
    const parsed = JSON.parse(secret);

    if (!isObject(parsed) || typeof parsed.provider !== "string") {
      return {
        provider: "generic",
        secret,
      };
    }

    if (parsed.provider === "ntfy") {
      return {
        provider: "ntfy",
        serverUrl:
          typeof parsed.serverUrl === "string" ? parsed.serverUrl : "",
        topic: typeof parsed.topic === "string" ? parsed.topic : "",
        authType:
          parsed.authType === "basic" || parsed.authType === "token"
            ? parsed.authType
            : "none",
        username:
          typeof parsed.username === "string" ? parsed.username : undefined,
        password:
          typeof parsed.password === "string" ? parsed.password : undefined,
        token: typeof parsed.token === "string" ? parsed.token : undefined,
      };
    }

    return {
      provider: "generic",
      secret: typeof parsed.secret === "string" ? parsed.secret : null,
    };
  } catch {
    return {
      provider: "generic",
      secret,
    };
  }
}

export function buildWebhookConfig(options: {
  provider: "generic" | "ntfy";
  secret?: string | null;
  serverUrl?: string;
  topic?: string;
  authType?: NtfyAuthType;
  username?: string;
  password?: string;
  token?: string;
}) {
  if (options.provider === "ntfy") {
    return JSON.stringify({
      provider: "ntfy",
      serverUrl: normalizeServerUrl(options.serverUrl || ""),
      topic: (options.topic || "").trim(),
      authType: options.authType || "none",
      username: options.username || undefined,
      password: options.password || undefined,
      token: options.token || undefined,
    });
  }

  return JSON.stringify({
    provider: "generic",
    secret: options.secret || null,
  });
}

export function serializeWebhookForClient(webhook: any) {
  const config = parseWebhookConfig(webhook.secret);

  if (config.provider === "ntfy") {
    return {
      ...webhook,
      provider: "ntfy",
      authType: config.authType,
      serverUrl: config.serverUrl,
      topic: config.topic,
      secret: null,
    };
  }

  return {
    ...webhook,
    provider: webhook.url?.includes("discord.com") ? "discord" : "generic",
    authType: "none",
    secret: null,
  };
}

function getNtfyPriority(priority?: string) {
  switch ((priority || "").toLowerCase()) {
    case "high":
      return "urgent";
    case "medium":
      return "default";
    case "low":
      return "low";
    default:
      return "default";
  }
}

function buildNtfyHeaders(config: Extract<StoredWebhookConfig, { provider: "ntfy" }>, message: any) {
  const headers: Record<string, string> = {
    Title:
      message.event === "ticket_status_changed"
        ? "Peppermint ticket status changed"
        : "Peppermint ticket created",
    Priority: getNtfyPriority(message.priority),
    Tags:
      message.event === "ticket_status_changed"
        ? "peppermint,ticket,warning"
        : "peppermint,ticket,inbox_tray",
  };

  if (config.authType === "basic" && config.username && config.password) {
    const credentials = Buffer.from(
      `${config.username}:${config.password}`,
      "utf8",
    ).toString("base64");
    headers.Authorization = `Basic ${credentials}`;
  }

  if (config.authType === "token" && config.token) {
    headers.Authorization = `Bearer ${config.token}`;
  }

  return headers;
}

function buildNtfyMessage(message: any) {
  if (message.event === "ticket_status_changed") {
    return [
      `Ticket #${message.id} status changed`,
      `Title: ${message.title || "Untitled ticket"}`,
      `Status: ${message.status || "Updated"}`,
      `Priority: ${message.priority || "Unknown"}`,
      `Requester: ${message.email || message.name || "Unknown requester"}`,
    ].join("\n");
  }

  return [
    `Ticket #${message.id} created`,
    `Title: ${message.title || "Untitled ticket"}`,
    `Priority: ${message.priority || "Unknown"}`,
    `Requester: ${message.email || message.name || "Unknown requester"}`,
    `Assigned to: ${message.assignedTo?.name || "Unassigned"}`,
    `Client: ${message.client?.name || "No client assigned"}`,
  ].join("\n");
}

export async function sendWebhookNotification(webhook: any, message: any) {
  if (!webhook.active) return;

  const url = webhook.url;
  const config = parseWebhookConfig(webhook.secret);

  if (config.provider === "ntfy") {
    try {
      await axios.post(buildNtfyUrl(config.serverUrl, config.topic), buildNtfyMessage(message), {
        headers: buildNtfyHeaders(config, message),
      });
    } catch (error) {
      console.error("Error sending ntfy notification:", error);
      throw error;
    }
    return;
  }

  if (url.includes("discord.com")) {
    const discordMessage = {
      embeds: [
        {
          title: "Issue Created",
          description: "A new issue has been created",
          color: getPriorityColor(message.priority), // Use the priority color function
          footer: {
            text: "Issue ID: " + message.id,
          },
          author: {
            name: "peppermint.sh",
            icon_url:
              "https://avatars.githubusercontent.com/u/76014454?s=200&v=4",
            url: "https://peppermint.sh/",
          },
          fields: [
            {
              name: "Title",
              value: message.title,
              inline: false,
            },
            {
              name: "Priority Level",
              value: message.priority,
              inline: false,
            },
            {
              name: "Contact Email",
              value: message.email ? message.email : "No email provided",
              inline: false,
            },
            {
              name: "Created By",
              value: message.createdBy.name,
              inline: false,
            },
            {
              name: "Assigned To",
              value: message.assignedTo
                ? message.assignedTo.name
                : "Unassigned",
              inline: false,
            },
            {
              name: "Client",
              value: message.client
                ? message.client.name
                : "No client assigned",
              inline: false,
            },
            {
              name: "Type",
              value: message.type,
              inline: false,
            },
          ],
        },
      ],
      content: "",
    };

    try {
      await axios.post(url, discordMessage);
      console.log("Discord webhook message sent successfully!");
    } catch (error: any) {
      if (error.response) {
        console.error("Discord API response error:", error.response.data);
      } else {
        console.error("Error sending Discord webhook:", error.message);
      }
      throw error;
    }
  } else {
    try {
      await axios.post(url, {
        data: message,
      });
    } catch (error) {
      console.error("Error sending webhook:", error);
    }
  }
}
