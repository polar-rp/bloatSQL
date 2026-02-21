import { useRef, useState, CSSProperties } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Table } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSelector } from '@tabler/icons-react';
import styles from './DataTable.module.css';

export type { ColumnDef, Row, SortingState, OnChangeFn };

export interface RowProps {
  style?: CSSProperties;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLTableRowElement>) => void;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  striped?: boolean;
  highlightOnHover?: boolean;
  withColumnBorders?: boolean;
  className?: string;
  style?: CSSProperties;
  getRowProps?: (row: Row<TData>) => RowProps;
  enableSorting?: boolean;
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;
  estimatedRowHeight?: number;
  overscan?: number;
}

export function DataTable<TData>({
  data,
  columns,
  striped = false,
  highlightOnHover = false,
  withColumnBorders = false,
  className,
  style,
  getRowProps,
  enableSorting = false,
  sorting,
  onSortingChange,
  estimatedRowHeight = 36,
  overscan = 5,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting: sorting ?? internalSorting,
    },
    onSortingChange: onSortingChange ?? setInternalSorting,
    enableSorting,
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
    // Mierzy rzeczywistą wysokość wierszy zamiast szacować – eliminuje skoki paddingTop
    measureElement: (element) => element.getBoundingClientRect().height,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0 ? totalSize - virtualItems[virtualItems.length - 1].end : 0;

  const colSpan = table.getVisibleFlatColumns().length;

  return (
    <div ref={scrollRef} className={`${styles.scrollContainer} ${className ?? ''}`} style={style}>
      <Table
        // striped celowo pominięty – Mantine liczy pasy przez CSS nth-of-type (pozycja w DOM),
        // co przy wirtualizacji powoduje miganie. Paski aplikujemy sami na podstawie
        // logicznego indeksu wiersza (virtualRow.index) za pomocą var(--table-striped-color).
        highlightOnHover={highlightOnHover}
        withColumnBorders={withColumnBorders}
        stickyHeader
      >
        <Table.Thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <Table.Tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = enableSorting && header.column.getCanSort();
                const sortDir = header.column.getIsSorted();
                return (
                  <Table.Th
                    key={header.id}
                    style={
                      header.column.getSize() !== 150
                        ? { width: header.column.getSize() }
                        : undefined
                    }
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    className={canSort ? styles.sortableHeader : undefined}
                  >
                    <span className={styles.headerContent}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span className={styles.sortIcon}>
                          {sortDir === 'asc' ? (
                            <IconChevronUp size={12} />
                          ) : sortDir === 'desc' ? (
                            <IconChevronDown size={12} />
                          ) : (
                            <IconSelector size={12} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      )}
                    </span>
                  </Table.Th>
                );
              })}
            </Table.Tr>
          ))}
        </Table.Thead>
        <Table.Tbody>
          {paddingTop > 0 && (
            <tr aria-hidden>
              <td colSpan={colSpan} style={{ height: paddingTop, padding: 0 }} />
            </tr>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const rowProps = getRowProps?.(row) ?? {};

            // Stripe oparty na logicznym indeksie danych, nie pozycji w DOM.
            // var(--table-striped-color) jest zawsze zdefiniowane przez klasę .table Mantine.
            const stripeStyle: CSSProperties =
              striped && virtualRow.index % 2 === 0
                ? { backgroundColor: 'var(--table-striped-color)' }
                : {};

            return (
              <Table.Tr
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                style={{ ...stripeStyle, ...rowProps.style }}
                className={rowProps.className}
                onClick={rowProps.onClick}
                onContextMenu={rowProps.onContextMenu}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr aria-hidden>
              <td colSpan={colSpan} style={{ height: paddingBottom, padding: 0 }} />
            </tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
