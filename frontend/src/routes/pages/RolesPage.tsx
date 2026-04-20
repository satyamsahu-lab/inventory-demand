import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";

import { api } from "../../shared/api";
import type { ApiResponse } from "../../shared/types";
import { Grid } from "../../shared/components/Grid";
import { Toolbar } from "../../shared/components/Toolbar";
import { Button } from "../../shared/components/Button";
import { Modal } from "../../shared/components/Modal";

type RoleRow = {
  id: string;
  name: string;
  created_by_admin_id: string | null;
};

export function RolesPage() {
  const [records, setRecords] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

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
    await api.post("/roles", { name });
    toast.success("Created");
    setOpen(false);
    setName("");
    await load();
  }

  return (
    <div>
      <Toolbar
        title="Roles"
        subtitle="Create and manage roles (permissions configured in Permissions module)"
        right={
          <>
            <Button onClick={() => setOpen(true)}>Add Role</Button>
          </>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl p-3">
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
        <div>
          <label className="text-sm font-medium">Role name</label>
          <input
            className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Store Manager"
          />
        </div>
      </Modal>
    </div>
  );
}
