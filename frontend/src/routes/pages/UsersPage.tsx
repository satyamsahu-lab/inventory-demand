import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import { Search, Plus } from "lucide-react";

import { api } from "../../shared/api";
import type { ApiResponse, Paginated } from "../../shared/types";
import { Grid } from "../../shared/components/Grid";
import { Toolbar } from "../../shared/components/Toolbar";
import { Button } from "../../shared/components/Button";
import { Modal } from "../../shared/components/Modal";
import { formatDateMMDDYYYY } from "../../shared/ui";
import { Pagination } from "../../shared/components/Pagination";

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role_id?: string;
  role_name: string;
  created_at: string;
};

type RoleRow = { id: string; name: string };

export function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<UserRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");

  const columns = useMemo<ColDef<UserRow>[]>(
    () => [
      {
        field: "full_name",
        headerName: "Full Name",
        minWidth: 200,
        cellRenderer: (p: any) => {
          const row: UserRow = p.data;
          return (
            <button
              className="text-left font-bold text-slate-900 hover:text-indigo-700 transition-colors"
              onClick={() => onEdit(row)}
              type="button"
            >
              {row.full_name}
            </button>
          );
        },
      },
      {
        field: "email",
        headerName: "Email",
        minWidth: 250,
        cellClass: "text-slate-500 font-medium",
      },
      {
        field: "role_name",
        headerName: "Role",
        width: 140,
        cellRenderer: (p: any) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-100 uppercase tracking-tight">
            {p.value}
          </span>
        ),
      },
      {
        field: "created_at",
        headerName: "Created",
        width: 140,
        cellClass: "text-slate-500",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
      },
    ],
    [],
  );

  async function load() {
    const res = await api.get<ApiResponse<Paginated<UserRow>>>("/users", {
      params: { page, limit, search, sortBy, sortOrder },
    });
    setRecords(res.data.data.records);
    setTotalPages(res.data.data.pagination.totalPages);
    setTotalRecords(res.data.data.pagination.totalRecords);
  }

  async function loadRoles() {
    const res = await api.get<ApiResponse<{ records: RoleRow[] }>>("/roles");
    setRoles(res.data.data.records);
    setRoleId((cur) => cur || res.data.data.records[0]?.id || "");
  }

  function onAdd() {
    setEditing(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setRoleId((cur) => cur || roles[0]?.id || "");
    setOpen(true);
  }

  function onEdit(row: UserRow) {
    setEditing(row);
    setFullName(row.full_name);
    setEmail(row.email);
    setPassword("");
    const match = roles.find((r) => r.name === row.role_name);
    setRoleId(match?.id || "");
    setOpen(true);
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load users",
      ),
    );
    loadRoles().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, sortBy, sortOrder]);

  async function onSave() {
    if (editing) {
      await api.put(`/users/${editing.id}`, {
        full_name: fullName,
        role_id: roleId,
      });
      toast.success("Updated");
    } else {
      await api.post("/users", {
        full_name: fullName,
        email,
        password,
        role_id: roleId,
      });
      toast.success("Created");
    }

    setOpen(false);
    setEditing(null);
    setFullName("");
    setEmail("");
    setPassword("");
    await load();
  }

  return (
    <div>
      <Toolbar
        title="Users"
        subtitle="Manage system users and access levels"
        right={
          <>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email"
                className="h-10 w-64 pl-10 pr-3 rounded-xl border border-slate-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none"
              />
            </div>
            <Button variant="secondary" onClick={() => load().catch(() => {})}>
              Search
            </Button>
            <Button
              className="bg-indigo-600 border-indigo-600 hover:bg-indigo-700"
              onClick={onAdd}
            >
              <Plus size={18} className="mr-1.5" /> Add User
            </Button>
          </>
        }
      />

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div>
          <Grid<UserRow>
            rowData={records}
            columnDefs={columns}
            gridOptions={{
              onSortChanged: (event) => {
                const sortState = event.api
                  .getColumnState()
                  .find((s) => s.sort != null);
                if (sortState) {
                  setSortBy(sortState.colId);
                  setSortOrder(sortState.sort as any);
                } else {
                  setSortBy("created_at");
                  setSortOrder("desc");
                }
                setPage(1);
              },
            }}
          />
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30">
          <Pagination
            page={page}
            totalRecords={totalRecords}
            totalPages={totalPages}
            pageSize={limit}
            onPageChange={setPage}
            onPageSizeChange={(s) => {
              setLimit(s);
              setPage(1);
            }}
          />
        </div>
      </div>

      <Modal
        open={open}
        title={editing ? "Edit User" : "Add User"}
        onClose={() => setOpen(false)}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
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
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-sm font-medium">Full name</label>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              value={fullName}
              placeholder="Enter full name"
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className="text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
              value={email}
              placeholder="Enter email"
              onChange={(e) => setEmail(e.target.value)}
              disabled={!!editing}
            />
          </div>
          {!editing && (
            <div>
              <label className="text-sm font-medium">Password</label>
              <input
                type="password"
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars"
              />
            </div>
          )}
          <div className={!editing ? "col-span-2" : ""}>
            <label className="text-sm font-medium">Role</label>
            <select
              className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 bg-white"
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
