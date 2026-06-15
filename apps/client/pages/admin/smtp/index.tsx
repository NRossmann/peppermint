import { toast } from "@/shadcn/hooks/use-toast";
import {
  defaultEmailTemplateSettings,
  EmailTemplateSettings,
  emailTemplateMetadata,
  getTemplateTriggerSummary,
  normalizeEmailTemplateSettings,
  TemplateType,
} from "../../../lib/emailTemplateSettings";
import { Button } from "@/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shadcn/ui/card";
import { Input } from "@/shadcn/ui/input";
import { Label } from "@/shadcn/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/ui/select";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

type TemplateRecord = {
  id: string;
  type: TemplateType;
  createdAt: string;
  updatedAt: string;
};

export default function Notifications() {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [provider, setProvider] = useState("");
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<any>();
  const [error, setError]: any = useState();
  const [templates, setTemplates] = useState<TemplateRecord[]>([]);
  const [templateSettings, setTemplateSettings] =
    useState<EmailTemplateSettings>(defaultEmailTemplateSettings);
  const [savingTemplateSettings, setSavingTemplateSettings] = useState(false);

  async function deleteEmailConfig() {
    setLoading(true);
    await fetch(`/api/v1/config/email`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        fetchEmailConfig();
      });
  }

  async function fetchTemplates() {
    await fetch("/api/v1/ticket/templates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTemplates(data.templates);
        }
      });
  }

  async function resetSMTP() {
    await fetch(`/api/v1/config/email`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        fetchEmailConfig();
      });
  }

  async function fetchEmailConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.active) {
          setEnabled(res.email.active);
          setConfig(res.email);
          setTemplateSettings(
            normalizeEmailTemplateSettings(res.email.templateSettings)
          );
          fetchTemplates();

          if (res.verification !== true) {
            setError(res.verification);
          } else {
            setError(undefined);
          }
        } else {
          setEnabled(false);
          setConfig(undefined);
          setError(undefined);
          setTemplateSettings(defaultEmailTemplateSettings);
        }
      })
      .then(() => setLoading(false));
  }

  async function saveTemplateRules() {
    setSavingTemplateSettings(true);

    await fetch(`/api/v1/config/email/template-settings`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        templateSettings,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.success) {
          toast({
            variant: "destructive",
            title: "Error",
            description:
              data.message || "Failed to update email template rules.",
          });
          return;
        }

        setTemplateSettings(
          normalizeEmailTemplateSettings(data.templateSettings)
        );
        toast({
          title: "Template rules updated",
          description:
            "SMTP template delivery rules have been saved successfully.",
        });
      })
      .finally(() => setSavingTemplateSettings(false));
  }

  useEffect(() => {
    fetchEmailConfig();
  }, []);

  const templatesByType = templates.reduce((acc, template) => {
    acc[template.type] = template;
    return acc;
  }, {} as Partial<Record<TemplateType, TemplateRecord>>);

  return (
    <main className="flex-1">
      <div className="relative max-w-4xl mx-auto md:px-8 xl:px-0">
        <div className="pt-10 pb-6">
          <div className="divide-y-2">
            <div className="px-4 sm:px-6 md:px-0 flex flex-row justify-between">
              <h1 className="text-3xl font-extrabold text-foreground">
                SMTP Email Settings
              </h1>

              <button className="text-xs" onClick={() => resetSMTP()}>
                Reset SMTP
              </button>
            </div>
            <div className="px-4 sm:px-6 md:px-0">
              <div className="sm:flex sm:items-center mt-4">
                <div className="sm:flex-auto">
                  <p className="mt-2 text-sm text-foreground-muted">
                    Manage your smtp email settings. These settings will be used
                    to send all outbound emails.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!loading ? (
          <div className="px-4 sm:px-6 md:px-0">
            <div className="mb-6">
              {enabled ? (
                <div className="space-y-6">
                  <div
                    className={`rounded-md p-4 ${
                      error
                        ? "bg-red-50 dark:bg-red-950/40"
                        : "bg-green-50 dark:bg-green-950/40"
                    }`}
                  >
                    <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon
                            className={`h-5 w-5 ${
                              error ? "text-red-400" : "text-green-400"
                            }`}
                            aria-hidden="true"
                          />
                        </div>
                        <div className="ml-3">
                          <h3
                            className={`text-sm font-medium ${
                              error
                                ? "text-red-800 dark:text-red-200"
                                : "text-green-800 dark:text-green-200"
                            }`}
                          >
                            {error
                              ? "SMTP authentication error"
                              : "SMTP configuration verified"}
                          </h3>
                          <div
                            className={`mt-2 text-sm ${
                              error
                                ? "text-red-700 dark:text-red-300"
                                : "text-green-700 dark:text-green-300"
                            }`}
                          >
                            <p>
                              {error?.message ||
                                "Peppermint can connect to this outbound email provider."}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEmailConfig()}
                        type="button"
                        className="rounded bg-red-500 text-white px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-secondary"
                      >
                        Delete Settings
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="mt-2 ml-0.5 flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        Verification Status
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Code: {error && error.code}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Response: {error && error.response}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Response Code: {error && error.responseCode}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        Command: {error && error.command}
                      </span>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Current SMTP configuration</CardTitle>
                      <CardDescription>
                        These settings are used for all outbound emails.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <dl className="grid gap-4 text-sm md:grid-cols-2">
                        <div>
                          <dt className="font-medium text-foreground">
                            Provider
                          </dt>
                          <dd className="text-muted-foreground">
                            {config?.serviceType || "other"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">
                            SMTP user
                          </dt>
                          <dd className="text-muted-foreground">
                            {config?.user || "Not set"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Host</dt>
                          <dd className="text-muted-foreground">
                            {config?.host || "Not set"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">Port</dt>
                          <dd className="text-muted-foreground">
                            {config?.port || "Not set"}
                          </dd>
                        </div>
                        <div>
                          <dt className="font-medium text-foreground">
                            Reply address
                          </dt>
                          <dd className="text-muted-foreground">
                            {config?.reply || "Not set"}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Email templates and delivery rules</CardTitle>
                      <CardDescription>
                        Each template below shows who receives the email, when
                        it is currently sent, and which trigger rules are
                        active.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(
                        Object.keys(emailTemplateMetadata) as TemplateType[]
                      ).map((templateType) => (
                        <TemplateRuleCard
                          key={templateType}
                          templateType={templateType}
                          template={templatesByType[templateType]}
                          templateSettings={templateSettings}
                          setTemplateSettings={setTemplateSettings}
                        />
                      ))}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <Button
                        onClick={saveTemplateRules}
                        disabled={savingTemplateSettings}
                      >
                        {savingTemplateSettings
                          ? "Saving rules..."
                          : "Save delivery rules"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-y-4 mt-8 justify-center items-center">
                    {step === 0 && (
                      <Card className="w-[350px]">
                        <CardHeader>
                          <CardTitle>Email Provider</CardTitle>
                          <CardDescription>
                            Certain providers require different settings.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                              <Label htmlFor="framework">Provider</Label>
                              <Select
                                onValueChange={(value) => setProvider(value)}
                              >
                                <SelectTrigger id="framework">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent position="popper">
                                  <SelectItem disabled value="microsoft">
                                    Microsoft
                                  </SelectItem>
                                  <SelectItem value="gmail">Google</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                          <Button variant="outline">Cancel</Button>
                          <Button
                            disabled={provider === ""}
                            onClick={() => setStep(1)}
                          >
                            Next
                          </Button>
                        </CardFooter>
                      </Card>
                    )}
                    {step === 1 && provider === "microsoft" && (
                      <MicrosoftSettings />
                    )}
                    {step === 1 && provider === "gmail" && (
                      <GmailSettings setStep={setStep} />
                    )}
                    {step === 1 && provider === "other" && (
                      <SMTP setStep={setStep} />
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </main>
  );
}

function TemplateRuleCard({
  templateType,
  template,
  templateSettings,
  setTemplateSettings,
}: {
  templateType: TemplateType;
  template?: TemplateRecord;
  templateSettings: EmailTemplateSettings;
  setTemplateSettings: Dispatch<SetStateAction<EmailTemplateSettings>>;
}) {
  const metadata = emailTemplateMetadata[templateType];

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold">{metadata.label}</h3>
            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Recipient: {metadata.recipient}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {metadata.description}
          </p>
          <p className="text-sm font-medium text-foreground">
            {getTemplateTriggerSummary(templateType, templateSettings)}
          </p>
        </div>

        {template ? (
          <a
            href={`/admin/smtp/templates/${template.id}`}
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            Edit template
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">
            Template missing
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3 border-t pt-4">
        {templateType === "ticket_created" && (
          <>
            <RuleCheckbox
              label="Enable this email template"
              checked={templateSettings.ticket_created.enabled}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_created: {
                    ...current.ticket_created,
                    enabled: checked,
                  },
                }))
              }
            />
            <RuleCheckbox
              label="Send when an internal user creates a ticket"
              checked={templateSettings.ticket_created.onInternalTicketCreate}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_created: {
                    ...current.ticket_created,
                    onInternalTicketCreate: checked,
                  },
                }))
              }
            />
            <RuleCheckbox
              label="Send when a requester creates a public ticket"
              checked={templateSettings.ticket_created.onPublicTicketCreate}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_created: {
                    ...current.ticket_created,
                    onPublicTicketCreate: checked,
                  },
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              This email is only sent when the ticket includes a valid requester
              email address.
            </p>
          </>
        )}

        {templateType === "ticket_assigned" && (
          <>
            <RuleCheckbox
              label="Enable this email template"
              checked={templateSettings.ticket_assigned.enabled}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_assigned: {
                    ...current.ticket_assigned,
                    enabled: checked,
                  },
                }))
              }
            />
            <RuleCheckbox
              label="Send when an assignee is set during ticket creation"
              checked={
                templateSettings.ticket_assigned.onTicketCreationAssignment
              }
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_assigned: {
                    ...current.ticket_assigned,
                    onTicketCreationAssignment: checked,
                  },
                }))
              }
            />
            <RuleCheckbox
              label="Send when an existing ticket is transferred or reassigned"
              checked={
                templateSettings.ticket_assigned.onTicketTransferAssignment
              }
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_assigned: {
                    ...current.ticket_assigned,
                    onTicketTransferAssignment: checked,
                  },
                }))
              }
            />
          </>
        )}

        {templateType === "ticket_comment" && (
          <>
            <RuleCheckbox
              label="Enable this email template"
              checked={templateSettings.ticket_comment.enabled}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_comment: {
                    ...current.ticket_comment,
                    enabled: checked,
                  },
                }))
              }
            />
            <p className="text-sm text-muted-foreground">
              This template is only used for public comments that are visible to
              the requester.
            </p>
          </>
        )}

        {templateType === "ticket_status_changed" && (
          <>
            <RuleCheckbox
              label="Enable this email template"
              checked={templateSettings.ticket_status_changed.enabled}
              onChange={(checked) =>
                setTemplateSettings((current) => ({
                  ...current,
                  ticket_status_changed: {
                    ...current.ticket_status_changed,
                    enabled: checked,
                  },
                }))
              }
            />
            <div className="space-y-1">
              <Label>Status change trigger</Label>
              <Select
                value={templateSettings.ticket_status_changed.trigger}
                onValueChange={(value: "resolved_only" | "any_state_change") =>
                  setTemplateSettings((current) => ({
                    ...current,
                    ticket_status_changed: {
                      ...current.ticket_status_changed,
                      trigger: value,
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resolved_only">
                    Only when a ticket changes between open and resolved
                  </SelectItem>
                  <SelectItem value="any_state_change">
                    On every ticket state change
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RuleCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function MicrosoftSettings() {
  return <div>Microsoft</div>;
}

function GmailSettings({ setStep }: { setStep: (step: number) => void }) {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [redirectUri, setRedirectUri] = useState(
    `${window.location.origin}/admin/smtp/oauth`
  );
  const [user, setUser] = useState("");

  const router = useRouter();

  async function submitGmailConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        host: "smtp.gmail.com",
        port: "465",
        clientId,
        clientSecret,
        username: user,
        reply: user,
        serviceType: "gmail",
        redirectUri: redirectUri,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.authorizeUrl) {
          router.push(res.authorizeUrl);
        }
      });
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Gmail Settings</CardTitle>
        <CardDescription>Configure your Gmail OAuth2 settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-4">
            <div className="">
              <label
                htmlFor="client_id"
                className="block text-sm font-medium text-foreground"
              >
                Client ID
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="client_id"
                  id="client_id"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Your Client ID"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="client_secret"
                className="block text-sm font-medium text-foreground"
              >
                Client Secret
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="client_secret"
                  id="client_secret"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Your Client Secret"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="user_email"
                className="block text-sm font-medium text-foreground"
              >
                User Email
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="user_email"
                  id="user_email"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Your Email"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="user_email"
                className="block text-sm font-medium text-foreground"
              >
                Redirect URI
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="redirect_uri"
                  id="redirect_uri"
                  className="flex-1 text-foreground text-sm bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="Your Redirect URI"
                  value={redirectUri}
                  onChange={(e) => setRedirectUri(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button
          size="sm"
          disabled={!clientId || !clientSecret || !user}
          onClick={() => submitGmailConfig()}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}

function SMTP({ setStep }: { setStep: (step: number) => void }) {
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [reply, setReply] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  async function submitConfig() {
    await fetch(`/api/v1/config/email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({
        host,
        active: true,
        port,
        reply,
        username,
        password,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        router.reload();
      });
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>SMTP Settings</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-4">
            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                SMTP Host
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="text"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="smtp.gmail.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Username
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Password
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="password"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Port
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="number"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="465"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                />
              </div>
            </div>

            <div className="">
              <label
                htmlFor="company_website"
                className="block text-sm font-medium text-foreground"
              >
                Reply Address
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <input
                  type="email"
                  name="company_website"
                  id="company_website"
                  className="flex-1 text-foreground text-sm  bg-transparent focus:ring-green-500 focus:border-green-500 block w-full min-w-0 rounded-md"
                  placeholder="reply@example.com"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button size="sm" variant="outline" onClick={() => setStep(0)}>
          Back
        </Button>
        <Button
          size="sm"
          disabled={!host || !port || !username || !password || !reply}
          onClick={() => submitConfig()}
        >
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
