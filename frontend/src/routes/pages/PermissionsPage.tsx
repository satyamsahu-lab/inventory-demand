import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import { api } from "../../shared/api";
import type { ApiResponse } from "../../shared/types";
import { Toolbar } from "../../shared/components/Toolbar";
import { Button } from "../../shared/components/Button";

type RoleRow = { id: string; name: string };
type PermissionRow = {
  id: string;
  module_name: string;
  action: "view" | "add" | "edit" | "delete";
};

export function PermissionsPage() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [permissions, setPermissions] = useState<PermissionRow[]>([]);
  const [rolePermissions, setRolePermissions] = useState<
    Record<string, string[]>
  >({});
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [dirty, setDirty] = useState(false);

  const modules = useMemo(() => {
    const set = new Set<string>();
    for (const p of permissions) set.add(p.module_name);
    return Array.from(set);
  }, [permissions]);

  async function load() {
    const res = await api.get<
      ApiResponse<{
        roles: RoleRow[];
        permissions: PermissionRow[];
        rolePermissions: Record<string, string[]>;
      }>
    >("/permissions/matrix");

    setRoles(res.data.data.roles);
    setPermissions(res.data.data.permissions);
    setRolePermissions(res.data.data.rolePermissions);
    setSelectedRoleId((cur) => cur || res.data.data.roles[0]?.id || "");
    setDirty(false);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load permissions",
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = rolePermissions[selectedRoleId] ?? [];

  function toggle(permissionId: string) {
    setRolePermissions((cur) => {
      const current = cur[selectedRoleId] ?? [];
      const next = current.includes(permissionId)
        ? current.filter((x) => x !== permissionId)
        : [...current, permissionId];
      return { ...cur, [selectedRoleId]: next };
    });
    setDirty(true);
  }

  function isChecked(moduleName: string, action: PermissionRow["action"]) {
    const p = permissions.find(
      (x) => x.module_name === moduleName && x.action === action,
    );
    if (!p) return false;
    return selected.includes(p.id);
  }

  async function onSave() {
    await api.post("/permissions/role-permissions", {
      role_id: selectedRoleId,
      permission_ids: selected,
    });
    toast.success("Updated");
    setDirty(false);
    await load();
  }

  return (
    <div>
      <Toolbar
        title="Permissions"
        subtitle="Manage role permissions (view/add/edit/delete per module)"
        right={
          <>
            <select
              className="h-10 px-3 rounded-lg border border-slate-200 bg-white"
              value={selectedRoleId}
              onChange={(e) => {
                setSelectedRoleId(e.target.value);
                setDirty(false);
              }}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button
              disabled={!dirty || !selectedRoleId}
              onClick={() =>
                onSave().catch((e) =>
                  toast.error(
                    e?.response?.data?.settings?.message ?? "Save failed",
                  ),
                )
              }
            >
              Save
            </Button>
          </>
        }
      />

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-0 border-b border-slate-200 bg-slate-50 text-sm font-semibold">
          <div className="col-span-6 p-3">Module</div>
          <div className="col-span-6 p-3">
            <div className="grid grid-cols-4">
              <div>View</div>
              <div>Add</div>
              <div>Edit</div>
              <div>Delete</div>
            </div>
          </div>
        </div>

        {modules.map((m) => (
          <div
            key={m}
            className="grid grid-cols-12 border-b border-slate-100 text-sm"
          >
            <div className="col-span-6 p-3 font-medium">{m}</div>
            <div className="col-span-6 p-3">
              <div className="grid grid-cols-4">
                {(["view", "add", "edit", "delete"] as const).map((a) => {
                  const perm = permissions.find(
                    (x) => x.module_name === m && x.action === a,
                  );
                  return (
                    <label
                      key={a}
                      className="flex items-center gap-2 select-none"
                    >
                      <input
                        type="checkbox"
                        disabled={!perm || !selectedRoleId}
                        checked={isChecked(m, a)}
                        onChange={() => perm && toggle(perm.id)}
                      />
                      <span className="capitalize">{a}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-slate-500 mt-3">
        Note: Your own role is hidden and cannot be modified (enforced by
        backend).
      </div>
    </div>
  );
}
