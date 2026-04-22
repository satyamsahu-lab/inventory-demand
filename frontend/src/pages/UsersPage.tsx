import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  Search,
  Plus,
  Download,
  LayoutGrid,
  List,
  User,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { z } from "zod";

import { api } from "../services/api";
import type { ApiResponse, Paginated } from "../types/index";
import { Grid } from "../components/ui/Table";
import { Toolbar } from "../components/layout/Toolbar";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { formatDateMMDDYYYY } from "../utils/formatDate";
import { FieldError } from "../components/ui/FieldError";
import { cn } from "../utils/cn";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { UserForm } from "../features/forms/components/UserForm";
import { ConfirmStatusChangeModal } from "../components/ui/ConfirmStatusChangeModal";

const userSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(100),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (val === undefined || val === "") return true;
        return val.length >= 8;
      },
      { message: "Password must be at least 8 characters" },
    ),
  roleId: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive"]).optional(),
});

type UserRow = {
  id: string;
  full_name: string;
  email: string;
  role_id?: string;
  role_name: string;
  status: string;
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
  const [sortBy, setSortBy] = useState<string | undefined>("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exportScope, setExportScope] = useState<"selected" | "page" | "all">(
    "all",
  );
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("");
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [confirmStatusModal, setConfirmStatusModal] = useState<{
    open: boolean;
    status: "active" | "inactive";
    ids: string[];
  }>({
    open: false,
    status: "active",
    ids: [],
  });
  const [statusLoading, setStatusLoading] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const gridRef = useRef<AgGridReact<UserRow>>(null);

  const columns = useMemo<ColDef<UserRow>[]>(
    () => [
      {
        headerName: "",
        width: 52,
        pinned: "left",
        sortable: false,
        filter: false,
        resizable: false,
        headerCheckboxSelection: true,
        checkboxSelection: true,
      },
      {
        field: "full_name",
        headerName: "Full Name",
        minWidth: 200,
        cellRenderer: (p: any) => {
          const row: UserRow = p.data;
          return (
            <button
              type="button"
              className="text-left font-bold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary)/0.8)] transition-all hover:translate-x-1"
              onClick={() => onEdit(row)}
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
          <div>
            <span className="inline-flex items-center px-2.5 rounded-full text-[10px] font-bold border bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border-[hsl(var(--border))] uppercase tracking-tight">
              {p.value}
            </span>
          </div>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        cellRenderer: (p: any) => {
          const isActive = p.value === "active";
          return (
            <div className="flex items-center h-full">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-bold border uppercase tracking-tight",
                  isActive
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-rose-50 text-rose-700 border-rose-100",
                )}
              >
                <div
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-emerald-500" : "bg-rose-500",
                  )}
                />
                {p.value}
              </span>
            </div>
          );
        },
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

  function handleClose() {
    setOpen(false);
    setEditing(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setStatus("active");
    setErrors({});
  }
  function onAdd() {
    handleClose();
    setOpen(true);
    setRoleId((cur) => cur || roles[0]?.id || "");
  }

  function onEdit(row: UserRow) {
    handleClose();
    setEditing(row);
    setFullName(row.full_name);
    setEmail(row.email);
    setRoleId(row.role_id || "");
    setStatus(row.status || "active");
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
    setErrors({});

    // Validate
    const result = userSchema.safeParse({
      fullName,
      email,
      password,
      roleId,
      status,
    });
    const fieldErrors: Record<string, string> = {};

    if (!result.success) {
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
    }

    // Manual overrides/additions
    if (!editing && !password) {
      fieldErrors.password = "Password is required";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    try {
      if (editing) {
        await api.put(`/users/${editing.id}`, {
          full_name: fullName,
          role_id: roleId,
          status,
        });
        toast.success("Updated");
      } else {
        await api.post("/users", {
          full_name: fullName,
          email,
          password,
          role_id: roleId,
          status,
        });
        toast.success("Created");
      }

      setOpen(false);
      setEditing(null);
      setFullName("");
      setEmail("");
      setPassword("");
      setErrors({});
      await load();
    } catch (e: any) {
      const msg = e?.response?.data?.settings?.message ?? "Save failed";
      if (msg.toLowerCase().includes("email")) {
        setErrors({ email: msg });
      } else if (msg.toLowerCase().includes("name")) {
        setErrors({ fullName: msg });
      } else if (msg.toLowerCase().includes("password")) {
        setErrors({ password: msg });
      } else {
        toast.error(msg);
      }
    }
  }

  async function onExport(
    format: "csv" | "pdf",
    scope: "selected" | "page" | "all",
  ) {
    if (scope === "selected") {
      const selectedRows = gridRef.current?.api.getSelectedRows() ?? [];
      if (selectedRows.length === 0) {
        toast.error("Please select at least one row to export");
        return;
      }
    }

    const ids =
      scope === "selected"
        ? (gridRef.current?.api.getSelectedRows() ?? []).map((r) => r.id)
        : [];

    const res = await api.get(`/users/export/file`, {
      params: {
        format,
        exportScope: scope,
        ids: ids.join(","),
        page,
        limit,
        search,
        sortBy,
        sortOrder,
      },
      responseType: "blob",
    });

    const blob = new Blob([res.data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function onBulkStatusChange(newStatus: "active" | "inactive") {
    const selectedRows = gridRef.current?.api.getSelectedRows() ?? [];
    if (selectedRows.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    setConfirmStatusModal({
      open: true,
      status: newStatus,
      ids: selectedRows.map((r) => r.id),
    });
  }

  async function handleConfirmStatusChange() {
    try {
      setStatusLoading(true);
      await api.post("/users/bulk-status", {
        ids: confirmStatusModal.ids,
        status: confirmStatusModal.status,
      });
      toast.success(
        `Successfully changed status to ${confirmStatusModal.status}`,
      );
      setConfirmStatusModal((cur) => ({ ...cur, open: false }));
      await load();
    } catch (error: any) {
      toast.error(error?.response?.data?.settings?.message ?? "Update failed");
    } finally {
      setStatusLoading(false);
    }
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
                className="h-10 w-64 pl-10 pr-3 rounded-xl border border-surface-200 bg-white focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--primary)/0.2)] transition-all outline-none"
              />
            </div>
            <Button variant="secondary" onClick={() => load().catch(() => {})}>
              Search
            </Button>
            <div className="h-8 w-px bg-slate-200 mx-2" />

            <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "table"
                    ? "bg-white text-[hsl(var(--primary))] shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "grid"
                    ? "bg-white text-[hsl(var(--primary))] shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2" />

            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
              <button
                disabled={selectedCount === 0}
                onClick={() => onBulkStatusChange("active")}
                title="Make Active"
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  selectedCount > 0
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-emerald-100"
                    : "bg-surface-50 text-surface-300 border border-surface-100 cursor-not-allowed",
                )}
              >
                <CheckCircle2 size={20} />
              </button>
              <button
                disabled={selectedCount === 0}
                onClick={() => onBulkStatusChange("inactive")}
                title="Make Inactive"
                className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center transition-all shadow-sm",
                  selectedCount > 0
                    ? "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 shadow-rose-100"
                    : "bg-surface-50 text-surface-300 border border-surface-100 cursor-not-allowed",
                )}
              >
                <XCircle size={20} />
              </button>
              <div className="h-8 w-px bg-surface-200 mx-2" />
            </div>

            <Button variant="secondary" onClick={() => setExportOpen(true)}>
              <Download size={18} className="text-emerald-600" />
              <span>Export</span>
            </Button>
            <Button
              className="bg-[hsl(var(--primary))] border-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]"
              onClick={onAdd}
            >
              <Plus size={18} className="mr-1.5" /> Add User
            </Button>
          </>
        }
      />

      {viewMode === "table" ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div>
            <Grid<UserRow>
              rowData={records}
              columnDefs={columns}
              gridRef={gridRef}
              gridOptions={{
                overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No users found</span></div>`,
                rowSelection: "multiple",
                suppressRowClickSelection: true,
                onSelectionChanged: (event) => {
                  setSelectedCount(event.api.getSelectedRows().length);
                },
                onSortChanged: (event) => {
                  const sortState = event.api
                    .getColumnState()
                    .find((s) => s.sort != null);
                  if (sortState) {
                    setSortBy(sortState.colId);
                    setSortOrder(sortState.sort as any);
                  } else {
                    setSortBy("updated_at");
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
      ) : (
        <div className="space-y-8">
          {records.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
              <EmptyState
                message="No users found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-surface-50 border border-surface-100 flex items-center justify-center text-surface-400 group-hover:bg-[hsl(var(--secondary))] group-hover:text-[hsl(var(--primary))] transition-colors">
                      <User size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-surface-900 truncate hover:text-[hsl(var(--primary))] transition-colors cursor-pointer"
                        onClick={() => onEdit(r)}
                      >
                        {r.full_name}
                      </h3>
                      <p className="text-xs text-slate-500 truncate">
                        {r.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-50">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-[hsl(var(--secondary))] text-[hsl(var(--primary))] border-[hsl(var(--border))] uppercase tracking-tight">
                      {r.role_name}
                    </span>
                    <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">
                      {formatDateMMDDYYYY(r.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 flex justify-center shadow-sm">
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
      )}

      <Modal
        open={exportOpen}
        title="Export Users"
        onClose={() => setExportOpen(false)}
        footer={
          <>
            <Button
              variant="ghost"
              className="px-6"
              onClick={() => setExportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="px-8"
              onClick={() =>
                onExport(exportFormat, exportScope)
                  .then(() => setExportOpen(false))
                  .catch(() => {})
              }
            >
              Export
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Export Type
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                className={cn(
                  "h-10 px-4 rounded-xl border text-sm font-bold transition-all",
                  exportFormat === "csv"
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                    : "bg-white border-surface-200 text-surface-700 hover:border-[hsl(var(--primary)/0.3)]",
                )}
                onClick={() => setExportFormat("csv")}
              >
                CSV
              </button>
              <button
                type="button"
                className={cn(
                  "h-10 px-4 rounded-xl border text-sm font-bold transition-all",
                  exportFormat === "pdf"
                    ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                    : "bg-white border-surface-200 text-surface-700 hover:border-[hsl(var(--primary)/0.3)]",
                )}
                onClick={() => setExportFormat("pdf")}
              >
                PDF
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Export Option
            </p>
            <div className="space-y-2">
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "selected"
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
                )}
                onClick={() => setExportScope("selected")}
              >
                <div className="font-bold text-sm text-slate-900">Selected</div>
                <div className="text-xs text-slate-500">
                  Export only checked rows
                </div>
              </button>
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "page"
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
                )}
                onClick={() => setExportScope("page")}
              >
                <div className="font-bold text-sm text-slate-900">
                  Current Page
                </div>
                <div className="text-xs text-slate-500">
                  Export current page with current filters/sort
                </div>
              </button>
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border px-4 py-3 transition-all",
                  exportScope === "all"
                    ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary))]"
                    : "border-surface-200 bg-white hover:border-[hsl(var(--primary)/0.3)]",
                )}
                onClick={() => setExportScope("all")}
              >
                <div className="font-bold text-sm text-slate-900">All</div>
                <div className="text-xs text-slate-500">
                  Export all records (with current filters)
                </div>
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={open}
        title={editing ? "Edit User" : "Add User"}
        onClose={handleClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave()}>Save</Button>
          </div>
        }
      >
        <UserForm
          fullName={fullName}
          setFullName={setFullName}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          roleId={roleId}
          setRoleId={setRoleId}
          status={status}
          setStatus={setStatus}
          roles={roles}
          editing={editing}
          errors={errors}
        />
      </Modal>

      <ConfirmStatusChangeModal
        open={confirmStatusModal.open}
        onClose={() =>
          setConfirmStatusModal((cur) => ({ ...cur, open: false }))
        }
        onConfirm={handleConfirmStatusChange}
        status={confirmStatusModal.status}
        count={confirmStatusModal.ids.length}
        loading={statusLoading}
      />
    </div>
  );
}
