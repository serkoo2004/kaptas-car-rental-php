import type { ReactNode } from "react";
import { EmptyState } from "@/components/ui/empty-state";

export function AdminTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  columns: string[];
  rows: Array<Array<ReactNode>>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-100 text-xs font-semibold uppercase text-slate-500">
            <tr>
              {columns.map((column) => (
                <th className="px-4 py-3.5" key={column}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, rowIndex) => (
              <tr className="transition hover:bg-[#fff8df]/70" key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td className="px-4 py-3.5 text-slate-700" key={cellIndex}>
                    {cell ?? "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
