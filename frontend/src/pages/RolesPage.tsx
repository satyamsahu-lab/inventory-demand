import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import { Plus } from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import type { ApiResponse } from "../types/index";
import { Grid } from "../components/ui/Table";
import { Toolbar } from "../components/layout/Toolbar";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { FieldError } from "../components/ui/FieldError";
import { cn } from "../utils/cn";

const roleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(50),
});

type RoleRow = {
  id: string;
  name: string;
  created_by_admin_id: string | null;
};

export function RolesPage() {
  const [records, setRecords] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const columns = useMemo<ColDef<RoleRow>[]>(
    () => [
      { field: "name", headerName: "Role", flex: 1 },
      {
        headerName: "Scope",
        valueGetter: (p: any) =>
          p.data?.created_by_admin_id ? "Custom" : "Global",
        width: 140,
      },
    ],
    [],
  );

  async function load() {
    const res = await api.get<ApiResponse<{ records: RoleRow[] }>>("/roles");
    setRecords(res.data.data.records);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load roles",
      ),
    );
  }, []);

  async function onCreate() {
    setErrors({});
    const result = roleSchema.safeParse({ name });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    await api.post("/roles", { name });
    toast.success("Created");
    setOpen(false);
    setName("");
    setErrors({});
    await load();
  }

  return (
    <div>
      <Toolbar
        title="Roles"
        subtitle="Create and manage roles (permissions configured in Permissions module)"
        right={
          <>
            <Button 
              className="bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-brand-200"
              onClick={() => {
                setErrors({});
                setName("");
                setOpen(true);
              }}
            >
              <Plus size={20} />
              <span>Add Role</span>
            </Button>
          </>
        }
      />

      <div className="card-premium">
        <Grid<RoleRow> rowData={records} columnDefs={columns} />
      </div>

      <Modal
        open={open}
        title="Add Role"
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                onCreate().catch((e) =>
                  toast.error(
                    e?.response?.data?.settings?.message ?? "Create failed",
                  ),
                )
              }
            >
              Create
            </Button>
          </div>
        }
      >
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest px-1">Role Name</label>
          <input
            className={cn(
              "w-full bg-surface-50 border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all font-medium",
              errors.name ? "border-rose-500 ring-4 ring-rose-500/10" : "border-surface-200 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            )}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Store Manager"
          />
          <FieldError error={errors.name} />
        </div>
      </Modal>
    </div>
  );
}
