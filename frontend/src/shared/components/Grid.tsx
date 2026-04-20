import { AgGridReact } from "ag-grid-react";
import type { ColDef, GridOptions } from "ag-grid-community";

import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";

export function Grid<T>(props: {
  rowData: T[];
  columnDefs: ColDef<T>[];
  gridOptions?: GridOptions<T>;
  className?: string;
}) {
  return (
    <div
      className={props.className ?? "ag-theme-quartz"}
      style={{ height: 500, width: "100%" }}
    >
      <AgGridReact<T>
        rowData={props.rowData}
        columnDefs={props.columnDefs}
        animateRows
        pagination={false}
        theme={"legacy" as any}
        rowHeight={52}
        headerHeight={48}
        defaultColDef={{
          sortable: true,
          filter: false,
          resizable: true,
          flex: 1,
          minWidth: 100,
        }}
        {...props.gridOptions}
      />
    </div>
  );
}
