export { TableStructureView } from './TableStructureView';
export { StructureTable } from './components/StructureTable';
export { StructureToolbar } from './components/StructureToolbar';
export { ColumnEditModal } from './components/ColumnEditModal';
export { DropColumnConfirmModal } from './components/DropColumnConfirmModal';
export { PendingChangesPreview } from './components/PendingChangesPreview';
export { useTableStructure } from './hooks/useTableStructure';
export { useApplyStructureChanges } from './hooks/useApplyStructureChanges';
export {
  buildAlterTableSQL,
  quoteIdentifier,
  buildColumnDefinitionSQL,
  getOperationPreviewSQL,
} from './utils/alterTableSqlBuilder';
