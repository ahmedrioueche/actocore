import { Fragment, type ReactNode } from "react";

export interface TableColumn<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  header: ReactNode;
  /** Width class (e.g. "w-24", "w-40") */
  width?: string;
  /** Text alignment (default: left) */
  align?: "left" | "center" | "right";
  /** Render function for cell content */
  render: (item: T, index: number) => ReactNode;
  /** Render skeleton for loading state */
  renderSkeleton?: () => ReactNode;
}

interface TableProps<T> {
  /** Array of column definitions */
  columns: TableColumn<T>[];
  /** Data to display */
  data: T[];
  /** Key extractor for React keys */
  keyExtractor: (item: T) => string;
  /** Optional row click handler */
  onRowClick?: (item: T) => void;
  /** Optional row class name function */
  rowClassName?: (item: T) => string;
  /** Render function for mobile card view */
  renderMobileCard?: (item: T, index: number) => ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton rows to show when loading (default: 5) */
  skeletonRowCount?: number;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Mobile loading skeleton */
  renderMobileLoadingSkeleton?: () => ReactNode;
  /** Custom wrapper class (replaces default bg-surface etc.) */
  wrapperClassName?: string;
  /** Custom header class (replaces default gradient) */
  headerClassName?: string;
  /** IDs of expanded rows */
  expandedRowKeys?: string[];
  /** Render function for expanded row content */
  renderExpandedRow?: (item: T) => ReactNode;
}

/**
 * Reusable Table component with desktop table and mobile card views.
 * Supports loading states, empty states, and fully customizable styling.
 */
export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowClassName,
  renderMobileCard,
  isLoading = false,
  skeletonRowCount = 5,
  emptyState,
  renderMobileLoadingSkeleton,
  wrapperClassName,
  headerClassName,
  expandedRowKeys,
  renderExpandedRow,
}: TableProps<T>) {
  const defaultWrapperClass =
    "bg-surface border border-border rounded-2xl overflow-hidden";
  const defaultHeaderClass =
    "bg-gradient-to-r from-primary/10 to-secondary/10 border-b border-border";

  const renderDesktopContent = () => {
    if (isLoading) {
      return Array.from({ length: skeletonRowCount }).map((_, i) => (
        <tr key={`skeleton-${i}`} className="animate-pulse">
          {columns.map((col) => (
            <td key={col.key} className="px-6 py-4">
              {col.renderSkeleton ? (
                col.renderSkeleton()
              ) : (
                <div className="h-4 bg-border rounded w-24" />
              )}
            </td>
          ))}
        </tr>
      ));
    }

    if (data.length === 0 && emptyState) {
      return (
        <tr>
          <td colSpan={columns.length} className="px-6 py-12">
            {emptyState}
          </td>
        </tr>
      );
    }

    return data.map((item, index) => {
      const key = keyExtractor(item);
      const isExpanded = expandedRowKeys?.includes(key);

      return (
        <Fragment key={key}>
          <tr
            onClick={onRowClick ? () => onRowClick(item) : undefined}
            className={`transition-colors duration-200 ${
              onRowClick ? "cursor-pointer" : ""
            } ${rowClassName ? rowClassName(item) : "hover:bg-muted/50"}`}
          >
            {columns.map((col) => (
              <td
                key={col.key}
                className={`px-6 py-4 ${
                  col.align === "right"
                    ? "text-end"
                    : col.align === "center"
                      ? "text-center"
                      : ""
                }`}
              >
                {col.render(item, index)}
              </td>
            ))}
          </tr>
          {isExpanded && renderExpandedRow && (
            <tr className="animate-in fade-in slide-in-from-top-2 duration-200">
              <td colSpan={columns.length} className="p-0">
                {renderExpandedRow(item)}
              </td>
            </tr>
          )}
        </Fragment>
      );
    });
  };

  const renderMobileContent = () => {
    if (!renderMobileCard) return null;

    if (isLoading && renderMobileLoadingSkeleton) {
      return Array.from({ length: skeletonRowCount }).map((_, i) => (
        <div key={`mobile-skeleton-${i}`}>{renderMobileLoadingSkeleton()}</div>
      ));
    }

    if (data.length === 0 && emptyState) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {emptyState}
        </div>
      );
    }

    return data.map((item, index) => (
      <div
        key={keyExtractor(item)}
        onClick={onRowClick ? () => onRowClick(item) : undefined}
        className={onRowClick ? "cursor-pointer" : ""}
      >
        {renderMobileCard(item, index)}
      </div>
    ));
  };

  return (
    <div className={wrapperClassName || defaultWrapperClass}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className={headerClassName || defaultHeaderClass}>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-6 py-4 text-sm font-semibold text-text-primary ${
                    col.width || ""
                  } ${
                    col.align === "right"
                      ? "text-end"
                      : col.align === "center"
                        ? "text-center"
                        : "text-start"
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {renderDesktopContent()}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      {renderMobileCard && (
        <div className="md:hidden divide-y divide-border">
          {renderMobileContent()}
        </div>
      )}
    </div>
  );
}

export default Table;
