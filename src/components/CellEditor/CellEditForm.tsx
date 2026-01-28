import { useEffect, useRef, useState } from 'react';
import {
  AppShell,
  Stack,
  Text,
  Textarea,
  TextInput,
  Button,
  Group,
  Badge,
  Alert,
  Title,
  ScrollArea,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX, IconAlertCircle, IconDeviceFloppy } from '@tabler/icons-react';
import {
  useSelectedCell,
  useClearCellSelection,
  useIsSavingCell,
  useSetSavingCell,
  useEditCellError,
  useSetEditCellError,
} from '../../stores/editCellStore';
import { tauriCommands } from '../../tauri/commands';
import { useQueryStore } from '../../stores/queryStore';

function formatValue(value: unknown): string {
  if (value === null) return '';
  if (value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function isMultilineValue(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  return value.length > 100 || value.includes('\n');
}

const inputStyles = {
  input: {
    fontFamily: 'monospace',
    fontSize: 'var(--mantine-font-size-sm)',
  },
};

export function CellEditForm() {
  const selectedCell = useSelectedCell();
  const clearSelection = useClearCellSelection();
  const isSaving = useIsSavingCell();
  const setSaving = useSetSavingCell();
  const error = useEditCellError();
  const setError = useSetEditCellError();
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSaved, setShowSaved] = useState(false);

  const initialFormValues = selectedCell
    ? Object.entries(selectedCell.rowData).reduce((acc, [key, value]) => {
        acc[key] = formatValue(value);
        return acc;
      }, {} as Record<string, string>)
    : {};

  const form = useForm({
    mode: 'controlled',
    initialValues: initialFormValues,
  });

  useEffect(() => {
    if (selectedCell) {
      const initialValues: Record<string, string> = {};
      Object.entries(selectedCell.rowData).forEach(([key, value]) => {
        initialValues[key] = formatValue(value);
      });
      form.setInitialValues(initialValues);
      form.setValues(initialValues);
      form.resetDirty(initialValues);
      setShowSaved(false);

      setTimeout(() => {
        const activeRef = inputRef.current ?? textareaRef.current;
        activeRef?.focus();
        activeRef?.select();
      }, 100);
    }
  }, [selectedCell]);

  const handleSubmit = async (values: Record<string, string>) => {
    if (!selectedCell || !selectedCell.tableName) {
      setError('Cannot update: table name not available');
      return;
    }

    if (!selectedCell.primaryKeyColumn || selectedCell.primaryKeyValue === undefined) {
      setError('Cannot update: primary key not found. Updates require a primary key.');
      return;
    }

    const changedColumns = Object.entries(values).filter(([key, value]) => {
      const originalValue = formatValue(selectedCell.rowData[key]);
      return value !== originalValue;
    });

    if (changedColumns.length === 0) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const whereClause = `\`${selectedCell.primaryKeyColumn}\` = ${
        typeof selectedCell.primaryKeyValue === 'string'
          ? `'${selectedCell.primaryKeyValue.replace(/'/g, "''")}'`
          : selectedCell.primaryKeyValue
      }`;

      for (const [columnName, newValue] of changedColumns) {
        const formattedValue = newValue === '' || newValue === null
          ? 'NULL'
          : `'${newValue.replace(/'/g, "''")}'`;

        await tauriCommands.updateCell({
          tableName: selectedCell.tableName,
          columnName,
          newValue: formattedValue,
          whereClause,
        });
      }

      await useQueryStore.getState().refreshTable();

      form.resetDirty(values);

      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to update cell';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    clearSelection();
    form.reset();
    setError(null);
  };

  if (!selectedCell) {
    return null;
  }

  const columns = Object.keys(selectedCell.rowData);
  const isDirty = form.isDirty();

  const renderLabel = (columnName: string, isPrimaryKey: boolean, isFocused: boolean) => (
    <Group gap={4}>
      <Text size="sm">{columnName}</Text>
      {isPrimaryKey && <Badge size="xs" variant="light" color="yellow">PK</Badge>}
      {isFocused && <Badge size="xs" variant="light" >Focused</Badge>}
    </Group>
  );

  return (
    <>
      <AppShell.Section>
        <Title order={4} mb="xs">Edit Row</Title>
        <Group gap="xs" mb="md">
          <Badge variant="light" >Row {selectedCell.rowIndex + 1}</Badge>
          {selectedCell.tableName && (
            <Badge variant="light" color="gray">{selectedCell.tableName}</Badge>
          )}
        </Group>

        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            withCloseButton
            onClose={() => setError(null)}
            mb="md"
          >
            {error}
          </Alert>
        )}
      </AppShell.Section>

      <AppShell.Section grow component={ScrollArea} type="hover">
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            {columns.map((columnName) => {
              const value = selectedCell.rowData[columnName];
              const isFocused = columnName === selectedCell.focusedColumn;
              const isMultiline = isMultilineValue(value);
              const isPrimaryKey = columnName === selectedCell.primaryKeyColumn;

              return isMultiline ? (
                <Textarea
                  key={columnName}
                  label={renderLabel(columnName, isPrimaryKey, isFocused)}
                  placeholder="Enter value"
                  minRows={3}
                  maxRows={6}
                  autosize
                  {...form.getInputProps(columnName)}
                  disabled={isSaving || isPrimaryKey}
                  ref={isFocused ? textareaRef : undefined}
                  styles={inputStyles}
                />
              ) : (
                <TextInput
                  key={columnName}
                  label={renderLabel(columnName, isPrimaryKey, isFocused)}
                  placeholder="Enter value"
                  {...form.getInputProps(columnName)}
                  disabled={isSaving || isPrimaryKey}
                  ref={isFocused ? inputRef : undefined}
                  styles={inputStyles}
                />
              );
            })}
          </Stack>
        </form>
      </AppShell.Section>

      <AppShell.Section mt="md">
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            onClick={handleCancel}
            disabled={isSaving}
            leftSection={<IconX size={16} />}
          >
            Close
          </Button>
          <Button
            onClick={() => form.onSubmit(handleSubmit)()}
            loading={isSaving}
            disabled={!isDirty || showSaved}
            color={showSaved ? 'green' : undefined}
            leftSection={showSaved ? <IconCheck size={16} /> : <IconDeviceFloppy size={16} />}
          >
            {showSaved ? 'Saved' : 'Save Changes'}
          </Button>
        </Group>
      </AppShell.Section>
    </>
  );
}
