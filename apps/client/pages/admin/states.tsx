import { Button } from "@/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shadcn/ui/card";
import { toast } from "@/shadcn/hooks/use-toast";
import { Input } from "@/shadcn/ui/input";
import { getCookie } from "cookies-next";
import { useEffect, useState } from "react";

type TicketState = {
  id: string;
  name: string;
  slug: string;
  color?: string | null;
  order: number;
  isResolved: boolean;
};

const emptyState = {
  name: "",
  slug: "",
  color: "bg-gray-500",
  order: 0,
  isResolved: false,
};

export default function AdminStates() {
  const [states, setStates] = useState<TicketState[]>([]);
  const [draft, setDraft] = useState(emptyState);
  const [loading, setLoading] = useState(true);

  async function fetchStates() {
    setLoading(true);

    const response = await fetch("/api/v1/ticket-states", {
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: data.message || "Failed to load states",
      });
      setLoading(false);
      return;
    }

    setStates(data.states || []);
    setLoading(false);
  }

  async function saveState(state: typeof emptyState | TicketState) {
    const isExisting = "id" in state;

    const response = await fetch(
      isExisting
        ? `/api/v1/ticket-states/${state.id}`
        : "/api/v1/ticket-states",
      {
        method: isExisting ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${getCookie("session")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: state.name,
          slug: state.slug,
          color: state.color,
          order: Number(state.order) || 0,
          isResolved: Boolean(state.isResolved),
        }),
      },
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: data.message || "Failed to save state",
      });
      return;
    }

    toast({
      title: isExisting ? "State updated" : "State created",
      description: `${state.name} was saved successfully.`,
    });

    if (!isExisting) {
      setDraft(emptyState);
    }

    fetchStates();
  }

  async function deleteState(id: string) {
    const response = await fetch(`/api/v1/ticket-states/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${getCookie("session")}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: data.message || "Failed to delete state",
      });
      return;
    }

    toast({
      title: "State deleted",
      description: "The state was deleted successfully.",
    });

    fetchStates();
  }

  useEffect(() => {
    fetchStates();
  }, []);

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle>Create State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-5">
            <Input
              placeholder="Name"
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <Input
              placeholder="Slug"
              value={draft.slug}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, slug: e.target.value }))
              }
            />
            <Input
              placeholder="Color class"
              value={draft.color}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, color: e.target.value }))
              }
            />
            <Input
              type="number"
              placeholder="Order"
              value={draft.order}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  order: Number(e.target.value) || 0,
                }))
              }
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isResolved}
                onChange={(e) =>
                  setDraft((prev) => ({
                    ...prev,
                    isResolved: e.target.checked,
                  }))
                }
              />
              Resolved
            </label>
          </div>
          <div className="mt-4">
            <Button onClick={() => saveState(draft)}>Add State</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>States</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="space-y-3">
              {states.map((state) => (
                <StateRow
                  key={state.id}
                  state={state}
                  onSave={saveState}
                  onDelete={deleteState}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StateRow({
  state,
  onSave,
  onDelete,
}: {
  state: TicketState;
  onSave: (state: TicketState) => void;
  onDelete: (id: string) => void;
}) {
  const [draft, setDraft] = useState(state);

  useEffect(() => {
    setDraft(state);
  }, [state]);

  return (
    <div className="grid gap-3 md:grid-cols-6 items-center border rounded-lg p-3">
      <Input
        value={draft.name}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, name: e.target.value }))
        }
      />
      <Input
        value={draft.slug}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, slug: e.target.value }))
        }
      />
      <Input
        value={draft.color || ""}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, color: e.target.value }))
        }
      />
      <Input
        type="number"
        value={draft.order}
        onChange={(e) =>
          setDraft((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))
        }
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.isResolved}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, isResolved: e.target.checked }))
          }
        />
        Resolved
      </label>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => onSave(draft)}>
          Save
        </Button>
        <Button variant="destructive" onClick={() => onDelete(state.id)}>
          Delete
        </Button>
      </div>
    </div>
  );
}
