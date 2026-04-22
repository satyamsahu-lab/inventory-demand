import { useMemo } from "react";

export function Pagination(props: {
  page: number;
  totalRecords: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
}) {
  const pageSizeOptions = props.pageSizeOptions ?? [10, 20, 50, 100];

  const from =
    props.totalRecords === 0 ? 0 : (props.page - 1) * props.pageSize + 1;
  const to = Math.min(props.page * props.pageSize, props.totalRecords);

  const pageNumbers = useMemo(() => {
    const maxButtons = 5;
    const total = Math.max(1, props.totalPages);
    const current = Math.min(Math.max(1, props.page), total);

    let start = Math.max(1, current - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > total) {
      end = total;
      start = Math.max(1, end - maxButtons + 1);
    }

    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }, [props.page, props.totalPages]);

  const canPrev = props.page > 1;
  const canNext = props.page < props.totalPages;

  return (
    <div className="mt-3 flex items-center justify-between text-sm">
      <div className="text-slate-500">
        Showing {from} to {to} of {props.totalRecords} entries
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={
              "h-8 w-8 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
            }
            disabled={!canPrev}
            onClick={() => props.onPageChange(Math.max(1, props.page - 1))}
          >
            ‹
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              type="button"
              className={
                "h-8 w-8 rounded border text-sm " +
                (p === props.page
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
              }
              onClick={() => props.onPageChange(p)}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            className={
              "h-8 w-8 rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
            }
            disabled={!canNext}
            onClick={() =>
              props.onPageChange(Math.min(props.totalPages, props.page + 1))
            }
          >
            ›
          </button>
        </div>

        <select
          className="h-8 rounded border border-slate-200 bg-white px-2"
          value={props.pageSize}
          onChange={(e) => props.onPageSizeChange(Number(e.target.value))}
        >
          {pageSizeOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
