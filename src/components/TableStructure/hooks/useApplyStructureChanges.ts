import { useCallback, useState } from 'react';
import { tauriCommands } from '../../../tauri/commands';
import { DatabaseType } from '../../../types/database';
import { AlterColumnOperation } from '../../../types/tableStructure';
import { buildAlterTableSQL } from '../utils/alterTableSqlBuilder';

interface ApplyResult {
  success: boolean;
  executedCount: number;
  totalCount: number;
  errors: string[];
}

interface UseApplyStructureChangesResult {
  applyChanges: (
    tableName: string,
    operations: AlterColumnOperation[],
    dbType: DatabaseType
  ) => Promise<ApplyResult>;
  isApplying: boolean;
}

export function useApplyStructureChanges(): UseApplyStructureChangesResult {
  const [isApplying, setIsApplying] = useState(false);

  const applyChanges = useCallback(
    async (
      tableName: string,
      operations: AlterColumnOperation[],
      dbType: DatabaseType
    ): Promise<ApplyResult> => {
      if (operations.length === 0) {
        return { success: true, executedCount: 0, totalCount: 0, errors: [] };
      }

      setIsApplying(true);
      const errors: string[] = [];
      let executedCount = 0;

      try {
        const statements = buildAlterTableSQL(tableName, operations, dbType);
        const totalCount = statements.length;

        for (const sql of statements) {
          try {
            await tauriCommands.executeQuery(sql);
            executedCount++;
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            errors.push(`SQL: ${sql}\nBłąd: ${errorMsg}`);
            break;
          }
        }

        return {
          success: errors.length === 0,
          executedCount,
          totalCount,
          errors,
        };
      } finally {
        setIsApplying(false);
      }
    },
    []
  );

  return { applyChanges, isApplying };
}
