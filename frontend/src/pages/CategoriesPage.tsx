import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { ColDef } from "ag-grid-community";
import type { AgGridReact } from "ag-grid-react";
import {
  Search,
  Plus,
  Tag,
  Tags,
  LayoutGrid,
  List,
  Layers,
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
import { cn } from "../utils/cn";
import { Pagination } from "../components/ui/Pagination";
import { EmptyState } from "../components/ui/EmptyState";
import { CategoryForm } from "../features/forms/components/CategoryForm";
import { useAuth } from "../store/auth";
import { can } from "../services/permissions";
import { ConfirmStatusChangeModal } from "../components/ui/ConfirmStatusChangeModal";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500, "Description is too long").optional(),
  parentId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional(),
});

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
  parent_name?: string | null;
  status: string;
  created_at: string;
}

export function CategoriesPage({
  type = "category",
}: {
  type?: "category" | "subcategory";
}) {
  const { permissions } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | undefined>("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | undefined>(
    "desc",
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedParentFilter, setSelectedParentFilter] =
    useState<string>("all");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [status, setStatus] = useState("active");
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const gridRef = useRef<AgGridReact<Category>>(null);

  const title = type === "category" ? "Categories" : "Subcategories";
  const moduleName = "Categories";

  function handleClose() {
    setOpen(false);
    setEditing(null);
    setName("");
    setDescription("");
    setParentId("");
    setStatus("active");
    setErrors({});
  }

  function onAdd() {
    handleClose();
    setOpen(true);
  }

  function onEdit(row: Category) {
    handleClose();
    setEditing(row);
    setName(row.name);
    setDescription(row.description || "");
    setParentId(row.parent_id || "");
    setStatus(row.status || "active");
    setOpen(true);
  }

  const handleEdit = (row: Category) => {
    if (can(permissions as any, moduleName, "edit")) {
      onEdit(row);
    }
  };

  async function onBulkStatusChange(newStatus: "active" | "inactive") {
    const selectedRows = gridRef.current?.api.getSelectedRows() ?? [];
    if (selectedRows.length === 0) {
      toast.error(`Please select at least one ${type}`);
      return;
    }

    setConfirmStatusModal({
      open: true,
      status: newStatus,
      ids: selectedRows.map((r) => r.id),
    });
  }

  const columns = useMemo<ColDef<Category>[]>(
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
        field: "name",
        headerName: `${type === "category" ? "Category" : "Subcategory"} Name`,
        minWidth: 200,
        cellRenderer: (p: any) => {
          const row: Category = p.data;
          return (
            <button
              className="text-left font-bold text-surface-900 hover:text-brand-600 transition-all hover:translate-x-1"
              onClick={() => handleEdit(row)}
              type="button"
            >
              {row.name}
            </button>
          );
        },
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
                  "inline-flex items-center gap-1.5 px-2.5 rounded-full text-[10px] font-black uppercase tracking-wider border",
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
      ...(type === "subcategory"
        ? [
            {
              field: "parent_name" as any,
              headerName: "Parent Category",
              width: 180,
              cellRenderer: (p: any) => (
                <span className="text-surface-500 font-medium">
                  {p.value || "-"}
                </span>
              ),
            },
          ]
        : []),
      {
        field: "created_at",
        headerName: "Created",
        width: 140,
        cellClass: "text-surface-500",
        valueFormatter: (p) => formatDateMMDDYYYY(p.value),
      },
    ],
    [type, permissions, moduleName],
  );

  async function load() {
    const params: any = {
      page,
      limit,
      search: search || undefined,
      sortBy,
      sortOrder,
    };

    if (type === "category") {
      params.parentId = "null";
    } else if (selectedParentFilter !== "all") {
      params.parentId = selectedParentFilter;
    }

    const res = await api.get<ApiResponse<Paginated<Category>>>("/categories", {
      params,
    });

    let records = res.data.data.records;
    if (type === "subcategory" && selectedParentFilter === "all") {
      records = records.filter((r: Category) => r.parent_id !== null);
    }

    setRecords(records);
    setTotalPages(res.data.data.pagination.totalPages);
    setTotalRecords(res.data.data.pagination.totalRecords);
  }

  async function loadParentCategories() {
    if (type !== "subcategory") return;
    try {
      const res = await api.get<ApiResponse<{ records: Category[] }>>(
        "/categories",
        {
          params: { parentId: "null", limit: 100 },
        },
      );
      setParentCategories(res.data.data.records);
    } catch (error) {
      console.error("Failed to fetch parent categories");
    }
  }

  async function handleConfirmStatusChange() {
    try {
      setStatusLoading(true);
      await api.post("/categories/bulk-status", {
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

  async function onSave() {
    setErrors({});
    const result = categorySchema.safeParse({
      name,
      description,
      parentId,
      status,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      const payload = {
        name,
        description,
        parent_id: type === "subcategory" ? parentId : null,
        status,
      };

      if (editing) {
        await api.put(`/categories/${editing.id}`, payload);
        toast.success("Updated successfully");
      } else {
        await api.post("/categories", payload);
        toast.success("Created successfully");
      }

      handleClose();
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.settings?.message ?? "Save failed");
    }
  }

  useEffect(() => {
    load().catch((e) =>
      toast.error(
        e?.response?.data?.settings?.message ?? "Failed to load categories",
      ),
    );
    if (type === "subcategory") {
      loadParentCategories().catch(() => {});
    }
  }, [page, limit, sortBy, sortOrder, type, selectedParentFilter]);

  return (
    <div>
      <Toolbar
        title={title}
        subtitle={`Manage product ${type === "category" ? "categories" : "subcategories"}`}
        right={
          <>
            <div className="relative group">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-brand-500 transition-colors"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name..."
                onKeyDown={(e) => e.key === "Enter" && load().catch(() => {})}
                className="h-11 w-64 pl-11 pr-4 rounded-xl border border-surface-200 bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium text-sm shadow-sm"
              />
            </div>

            <Button
              variant="secondary"
              className="h-11 px-6"
              onClick={() => load().catch(() => {})}
            >
              Search
            </Button>

            <div className="h-8 w-px bg-surface-200 mx-2" />

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

            <div className="flex bg-surface-100 p-1 rounded-xl gap-1">
              <button
                onClick={() => setViewMode("table")}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all",
                  viewMode === "table"
                    ? "bg-white text-brand-600 shadow-sm"
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
                    ? "bg-white text-brand-600 shadow-sm"
                    : "text-surface-400 hover:text-surface-600",
                )}
              >
                <LayoutGrid size={18} />
              </button>
            </div>

            <div className="h-8 w-px bg-surface-200 mx-2" />

            {can(permissions as any, moduleName, "add") && (
              <Button
                className="bg-brand-600 hover:bg-brand-700 h-11 px-6 shadow-brand-200"
                onClick={onAdd}
              >
                <Plus size={20} className="mr-1.5" /> Add{" "}
                {type === "category" ? "Category" : "Subcategory"}
              </Button>
            )}
          </>
        }
      />

      {viewMode === "table" ? (
        <div className="bg-white border border-surface-200 rounded-2xl shadow-sm overflow-hidden">
          <div>
            <Grid<Category>
              rowData={records}
              columnDefs={columns}
              gridRef={gridRef}
              gridOptions={{
                overlayNoRowsTemplate: `<div class="flex flex-col items-center justify-center p-8 text-surface-500"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-2 opacity-50"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M15 8l-7 7"/><path d="M8 8l7 7"/></svg><span>No ${title.toLowerCase()} found</span></div>`,
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

          <div className="px-8 py-5 border-t border-surface-100 bg-surface-50/30">
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
            <div className="bg-white border border-surface-200 rounded-2xl shadow-sm">
              <EmptyState
                message={`No ${title.toLowerCase()} found`}
                description="Try adjusting your search or filters to find what you're looking for."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
              {records.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-surface-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-surface-50 border border-surface-100 flex items-center justify-center text-surface-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors">
                      <Layers size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3
                        className="font-bold text-surface-900 truncate hover:text-brand-600 transition-colors cursor-pointer"
                        onClick={() => handleEdit(r)}
                      >
                        {r.name}
                      </h3>
                      {type === "subcategory" && (
                        <p className="text-xs text-surface-500 truncate">
                          Parent: {r.parent_name || "N/A"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-surface-50">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-brand-50 text-brand-700 border-brand-100 uppercase tracking-tight">
                      {type === "category" ? "Category" : "Subcategory"}
                    </span>
                    <p className="text-[10px] text-surface-400 font-medium uppercase tracking-wider">
                      {formatDateMMDDYYYY(r.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white border border-surface-200 rounded-2xl px-6 py-4 flex justify-center shadow-sm">
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
        open={open}
        title={
          editing
            ? `Edit ${type === "category" ? "Category" : "Subcategory"}`
            : `Add ${type === "category" ? "Category" : "Subcategory"}`
        }
        onClose={handleClose}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" className="px-6" onClick={handleClose}>
              Cancel
            </Button>
            <Button className="px-8 shadow-brand-200" onClick={() => onSave()}>
              Save
            </Button>
          </div>
        }
      >
        <CategoryForm
          type={type}
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          parentId={parentId}
          setParentId={setParentId}
          status={status}
          setStatus={setStatus}
          categories={parentCategories}
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
