import { toast } from "@/shadcn/hooks/use-toast";
import { hasAccess } from "@/shadcn/lib/hasAccess";
import { Switch } from "@headlessui/react";
import { getCookie } from "cookies-next";
import { useState } from "react";
import { useQuery } from "react-query";

type HookEvent = "ticket_created" | "ticket_status_changed";
type HookProvider = "generic" | "discord" | "ntfy";
type NtfyAuthType = "none" | "basic" | "token";

type WebhookRecord = {
  id: string;
  name: string;
  url: string;
  type: HookEvent;
  active: boolean;
  provider?: HookProvider;
  authType?: NtfyAuthType;
  serverUrl?: string;
  topic?: string;
};

type FormState = {
  name: string;
  active: boolean;
  type: HookEvent;
  provider: "generic" | "ntfy";
  url: string;
  ntfyServerUrl: string;
  ntfyTopic: string;
  ntfyAuthType: NtfyAuthType;
  ntfyUsername: string;
  ntfyPassword: string;
  ntfyToken: string;
};

const eventLabels: Record<HookEvent, string> = {
  ticket_created: "Ticket created",
  ticket_status_changed: "Ticket status changed",
};

const providerLabels: Record<HookProvider | "generic", string> = {
  generic: "Generic webhook",
  discord: "Discord webhook",
  ntfy: "ntfy",
};

const authLabels: Record<NtfyAuthType, string> = {
  none: "No auth",
  basic: "Username + password",
  token: "Bearer token",
};

const initialFormState: FormState = {
  name: "",
  active: true,
  type: "ticket_created",
  provider: "generic",
  url: "",
  ntfyServerUrl: "",
  ntfyTopic: "",
  ntfyAuthType: "none",
  ntfyUsername: "",
  ntfyPassword: "",
  ntfyToken: "",
};

async function getHooks() {
  const res = await fetch(`/api/v1/webhooks/all`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getCookie("session")}`,
    },
  });

  hasAccess(res);

  return res.json();
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function formatHookTarget(hook: WebhookRecord) {
  if (hook.provider === "ntfy") {
    return `${hook.serverUrl}/${hook.topic}`;
  }

  return hook.url;
}

export default function Notifications() {
  const [show, setShow] = useState<"main" | "create">("main");
  const [form, setForm] = useState<FormState>(initialFormState);

  const { data, status, refetch } = useQuery("gethooks", getHooks);

  async function addHook() {
    const payload =
      form.provider === "ntfy"
        ? {
            name: form.name,
            active: form.active,
            type: form.type,
            provider: "ntfy",
            ntfyServerUrl: form.ntfyServerUrl,
            ntfyTopic: form.ntfyTopic,
            ntfyAuthType: form.ntfyAuthType,
            ntfyUsername: form.ntfyUsername,
            ntfyPassword: form.ntfyPassword,
            ntfyToken: form.ntfyToken,
          }
        : {
            name: form.name,
            active: form.active,
            type: form.type,
            provider: "generic",
            url: form.url,
          };

    await fetch(`/api/v1/webhook/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          toast({
            title: "Webhook created",
            description:
              form.provider === "ntfy"
                ? "The ntfy notification target was added successfully."
                : "The webhook was added successfully.",
          });
          setForm(initialFormState);
          refetch();
          setShow("main");
          return;
        }

        toast({
          variant: "destructive",
          title: "Error",
          description: res.message || "Unable to add webhook.",
        });
      });
  }

  async function deleteHook(id: string) {
    await fetch(`/api/v1/admin/webhook/${id}/delete`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        refetch();

        if (res.error) {
          toast({
            variant: "destructive",
            title: "Delete failed",
            description: res.error,
          });
        }
      });
  }

  const webhooks: WebhookRecord[] = data?.webhooks || [];

  return (
    <main className="flex-1">
      <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
        <div className="pt-10 pb-16">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0">
              <h1 className="text-3xl font-extrabold text-foreground">
                Webhook Settings
              </h1>
            </div>
          </div>

          <div className="px-4 sm:px-6 md:px-0">
            <div className="py-6">
              <div className={show === "main" ? "" : "hidden"}>
                {status === "success" && (
                  <>
                    <div className="sm:flex sm:items-center sm:justify-between gap-4">
                      <div className="sm:flex-auto">
                        <p className="mt-2 text-sm text-foreground">
                          Webhooks notify external services when Peppermint
                          events happen. You can send generic JSON POST requests
                          or use native ntfy delivery with username/password or
                          bearer token authentication.
                        </p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:flex-none">
                        <button
                          onClick={() => setShow("create")}
                          type="button"
                          className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-900"
                        >
                          Add Webhook
                        </button>
                      </div>
                    </div>

                    <div className="mt-6">
                      {webhooks.length > 0 ? (
                        <div className="flex flex-col gap-4">
                          {webhooks.map((hook) => (
                            <div
                              key={hook.id}
                              className="rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
                            >
                              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-foreground">
                                      {hook.name}
                                    </p>
                                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {eventLabels[hook.type]}
                                    </span>
                                    <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                      {providerLabels[hook.provider || "generic"]}
                                    </span>
                                    {hook.provider === "ntfy" && (
                                      <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                        {authLabels[hook.authType || "none"]}
                                      </span>
                                    )}
                                  </div>
                                  <p className="mt-2 truncate text-sm text-foreground">
                                    {formatHookTarget(hook)}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {hook.provider === "ntfy"
                                      ? "Peppermint sends a native ntfy publish request to this topic."
                                      : "Peppermint sends a JSON POST request to this URL."}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span
                                    className={classNames(
                                      "rounded px-2 py-1 text-xs font-medium",
                                      hook.active
                                        ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-200"
                                        : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
                                    )}
                                  >
                                    {hook.active ? "Active" : "Inactive"}
                                  </span>
                                  <button
                                    onClick={() => deleteHook(hook.id)}
                                    type="button"
                                    className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-foreground">
                          You currently have no webhooks configured.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className={show === "create" ? "" : "hidden"}>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Create webhook
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Configure either a generic JSON webhook or a native ntfy
                        topic with optional authentication.
                      </p>
                    </div>
                    <button
                      onClick={() => setShow("main")}
                      type="button"
                      className="rounded bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-950 dark:text-white dark:ring-gray-700 dark:hover:bg-gray-900"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="mt-6 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground">
                        Webhook Name
                      </label>
                      <input
                        type="text"
                        className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Event
                        </label>
                        <select
                          className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent py-2 text-foreground shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                          value={form.type}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              type: event.target.value as HookEvent,
                            }))
                          }
                        >
                          <option value="ticket_created">Ticket created</option>
                          <option value="ticket_status_changed">
                            Ticket status changed
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Delivery Type
                        </label>
                        <select
                          className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent py-2 text-foreground shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                          value={form.provider}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              provider: event.target.value as "generic" | "ntfy",
                            }))
                          }
                        >
                          <option value="generic">Generic JSON webhook</option>
                          <option value="ntfy">ntfy</option>
                        </select>
                      </div>
                    </div>

                    {form.provider === "generic" ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground">
                          Payload URL
                        </label>
                        <input
                          type="text"
                          className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                          placeholder="https://example.com/webhook"
                          value={form.url}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              url: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-5 md:grid-cols-2">
                          <div>
                            <label className="block text-sm font-medium text-foreground">
                              ntfy Server URL
                            </label>
                            <input
                              type="text"
                              className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              placeholder="https://ntfy.example.com"
                              value={form.ntfyServerUrl}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  ntfyServerUrl: event.target.value,
                                }))
                              }
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-foreground">
                              Topic
                            </label>
                            <input
                              type="text"
                              className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              placeholder="peppermint-alerts"
                              value={form.ntfyTopic}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  ntfyTopic: event.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground">
                            Authentication
                          </label>
                          <select
                            className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent py-2 text-foreground shadow-sm focus:border-green-500 focus:outline-none focus:ring-green-500 sm:text-sm"
                            value={form.ntfyAuthType}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                ntfyAuthType: event.target.value as NtfyAuthType,
                              }))
                            }
                          >
                            <option value="none">No authentication</option>
                            <option value="basic">
                              Username + password
                            </option>
                            <option value="token">Bearer token</option>
                          </select>
                        </div>

                        {form.ntfyAuthType === "basic" && (
                          <div className="grid gap-5 md:grid-cols-2">
                            <div>
                              <label className="block text-sm font-medium text-foreground">
                                Username
                              </label>
                              <input
                                type="text"
                                className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                value={form.ntfyUsername}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    ntfyUsername: event.target.value,
                                  }))
                                }
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-foreground">
                                Password
                              </label>
                              <input
                                type="password"
                                className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                                value={form.ntfyPassword}
                                onChange={(event) =>
                                  setForm((current) => ({
                                    ...current,
                                    ntfyPassword: event.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        )}

                        {form.ntfyAuthType === "token" && (
                          <div>
                            <label className="block text-sm font-medium text-foreground">
                              Bearer token
                            </label>
                            <input
                              type="password"
                              className="mt-2 block w-full rounded-md border border-gray-300 bg-transparent text-foreground shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                              value={form.ntfyToken}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  ntfyToken: event.target.value,
                                }))
                              }
                            />
                          </div>
                        )}
                      </>
                    )}

                    <Switch.Group
                      as="div"
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <span className="flex-grow">
                        <Switch.Label
                          as="span"
                          className="text-sm font-medium text-foreground"
                          passive
                        >
                          Active
                        </Switch.Label>
                        <p className="text-xs text-muted-foreground">
                          Disabled webhooks stay saved but do not receive
                          notifications.
                        </p>
                      </span>
                      <Switch
                        checked={form.active}
                        onChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            active: value,
                          }))
                        }
                        className={classNames(
                          form.active
                            ? "bg-green-600"
                            : "bg-gray-200 dark:bg-gray-700",
                          "relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={classNames(
                            form.active ? "translate-x-5" : "translate-x-0",
                            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-gray-100",
                          )}
                        />
                      </Switch>
                    </Switch.Group>

                    <button
                      onClick={addHook}
                      type="button"
                      className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700"
                    >
                      Add Webhook
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
