import { toast } from "@/shadcn/hooks/use-toast";
import { getCookie } from "cookies-next";
import { useRouter } from "next/router";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-clike";
import { useEffect, useState } from "react";
import Editor from "react-simple-code-editor";

const templateVariables: Record<string, string[]> = {
  ticket_created: ["{{id}}"],
  ticket_comment: ["{{title}}", "{{comment}}"],
  ticket_status_changed: ["{{title}}", "{{status}}"],
  ticket_assigned: [],
};

const templateLabels: Record<string, string> = {
  ticket_created: "Ticket created",
  ticket_comment: "Ticket comment",
  ticket_status_changed: "Ticket status changed",
  ticket_assigned: "Ticket assigned",
};

export default function EmailTemplates() {
  const [template, setTemplate] = useState<any>();
  const [templateType, setTemplateType] = useState<string>("");

  const router = useRouter();

  async function fetchTemplate() {
    await fetch(`/api/v1/ticket/template/${router.query.id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          setTemplate(data.template[0].html);
          setTemplateType(data.template[0].type || "");
        }
      });
  }

  async function updateTemplate() {
    await fetch(`/api/v1/ticket/template/${router.query.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getCookie("session")}`,
      },
      body: JSON.stringify({ html: template }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          toast({
            variant: "default",
            title: "Success",
            description: `Template updated`,
          });
        }
      });
  }

  useEffect(() => {
    fetchTemplate();
  }, []);

  const availableVariables = templateVariables[templateType] || [];
  const templateLabel = templateLabels[templateType] || "Email template";

  return (
    <div className="flex h-screen min-w-0 flex-col overflow-hidden">
      <div className="border-b bg-background px-4 py-3 shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold">{templateLabel}</h1>
            <p className="text-sm text-muted-foreground">
              Edit the HTML email template and preview it side by side.
            </p>
          </div>
          <button
            type="button"
            onClick={updateTemplate}
            className="shrink-0 rounded-md bg-green-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Update Template
          </button>
        </div>

        <div className="mt-3 rounded-lg border bg-muted/30 p-3">
          <p className="text-sm font-medium">Available placeholders</p>
          {availableVariables.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {availableVariables.map((variable) => (
                <code
                  key={variable}
                  className="rounded bg-background px-2 py-1 text-xs"
                >
                  {variable}
                </code>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              This template currently has no dynamic placeholders.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        <div className="flex min-h-full min-w-0 flex-col xl:flex-row">
          <div className="min-w-0 xl:w-1/2 border-b xl:border-b-0 xl:border-r overflow-auto">
            <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-2 backdrop-blur">
              <span className="text-sm font-medium">HTML source</span>
            </div>
            <div className="min-w-0 overflow-auto p-2">
              {template !== undefined && (
                <Editor
                  value={template}
                  onValueChange={(code) => setTemplate(code)}
                  highlight={(code) => highlight(code, languages.js, "html")}
                  padding={10}
                  style={{
                    fontFamily: '"Fira code", "Fira Mono", monospace',
                    fontSize: 12,
                    minHeight: "100%",
                  }}
                  textareaClassName="min-h-[70vh] outline-none"
                />
              )}
            </div>
          </div>

          <div className="min-w-0 xl:w-1/2 overflow-auto">
            <div className="sticky top-0 z-10 border-b bg-background/95 px-4 py-2 backdrop-blur">
              <span className="text-sm font-medium">Preview</span>
            </div>
            <div className="min-w-0 overflow-auto p-4">
              <div className="mx-auto max-w-3xl rounded-lg border bg-white p-4 shadow-sm">
                <div dangerouslySetInnerHTML={{ __html: template }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
