import { useEffect, useState } from 'react';
import {
  AppShell,
  Stack,
  Text,
  TextInput,
  Select,
  NumberInput,
  Checkbox,
  Button,
  Group,
  Badge,
  Title,
  ScrollArea,
  Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import {
  useStructureEditStore,
  useEditingColumnDraft,
  useIsAddingNewColumn,
} from '../../stores/structureEditStore';
import { ColumnDefinition } from '../../types/tableStructure';

const DATA_TYPES = [
  {
    group: 'String',
    items: [
      { value: 'VARCHAR', label: 'VARCHAR' },
      { value: 'CHAR', label: 'CHAR' },
      { value: 'TEXT', label: 'TEXT' },
      { value: 'MEDIUMTEXT', label: 'MEDIUMTEXT' },
      { value: 'LONGTEXT', label: 'LONGTEXT' },
    ],
  },
  {
    group: 'Numeric',
    items: [
      { value: 'INT', label: 'INT' },
      { value: 'BIGINT', label: 'BIGINT' },
      { value: 'SMALLINT', label: 'SMALLINT' },
      { value: 'TINYINT', label: 'TINYINT' },
      { value: 'DECIMAL', label: 'DECIMAL' },
      { value: 'FLOAT', label: 'FLOAT' },
      { value: 'DOUBLE', label: 'DOUBLE' },
    ],
  },
  {
    group: 'Date/Time',
    items: [
      { value: 'DATE', label: 'DATE' },
      { value: 'DATETIME', label: 'DATETIME' },
      { value: 'TIMESTAMP', label: 'TIMESTAMP' },
      { value: 'TIME', label: 'TIME' },
    ],
  },
  {
    group: 'Other',
    items: [
      { value: 'BOOLEAN', label: 'BOOLEAN' },
      { value: 'JSON', label: 'JSON' },
      { value: 'BLOB', label: 'BLOB' },
    ],
  },
];

interface ColumnFormValues {
  name: string;
  dataType: string;
  length: number | '';
  isNullable: boolean;
  defaultValue: string;
}

export function ColumnEditForm() {
  const editingColumn = useEditingColumnDraft();
  const isAddingNew = useIsAddingNewColumn();
  const { addColumn, modifyColumn, clearColumnDraft } = useStructureEditStore();
  const [error, setError] = useState<string | null>(null);

  const mode = isAddingNew ? 'add' : 'edit';

  const form = useForm<ColumnFormValues>({
    initialValues: {
      name: '',
      dataType: 'VARCHAR',
      length: 255,
      isNullable: true,
      defaultValue: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Column name is required';
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
          return 'Invalid column name';
        }
        return null;
      },
      dataType: (value) => (!value ? 'Data type is required' : null),
    },
  });

  useEffect(() => {
    if (mode === 'edit' && editingColumn) {
      form.setValues({
        name: editingColumn.name,
        dataType: editingColumn.parsed.baseType.toUpperCase(),
        length: editingColumn.characterMaximumLength ?? '',
        isNullable: editingColumn.isNullable,
        defaultValue: editingColumn.columnDefault ?? '',
      });
    } else if (mode === 'add') {
      form.reset();
    }
    setError(null);
  }, [editingColumn, isAddingNew]);

  const handleSubmit = (values: ColumnFormValues) => {
    try {
      const definition: ColumnDefinition = {
        name: values.name.trim(),
        dataType: values.dataType,
        length: values.length === '' ? undefined : values.length,
        isNullable: values.isNullable,
        isPrimaryKey: editingColumn?.isPrimaryKey ?? false,
        defaultValue: values.defaultValue.trim() || null,
      };

      if (mode === 'edit' && editingColumn) {
        modifyColumn(editingColumn.name, definition);
      } else {
        addColumn(definition);
      }

      clearColumnDraft();
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save column';
      setError(errorMsg);
    }
  };

  const handleCancel = () => {
    clearColumnDraft();
    form.reset();
    setError(null);
  };

  if (!isAddingNew && !editingColumn) {
    return null;
  }

  const needsLength = ['VARCHAR', 'CHAR', 'DECIMAL', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT'].includes(
    form.values.dataType
  );

  return (
    <>
      <AppShell.Section>
        <Title order={4} mb="xs">
          {mode === 'add' ? 'Add New Column' : 'Edit Column'}
        </Title>
        {mode === 'edit' && editingColumn && (
          <Group gap="xs" mb="md">
            <Badge variant="light">{editingColumn.name}</Badge>
            {editingColumn.isPrimaryKey && (
              <Badge variant="light" color="yellow">Primary Key</Badge>
            )}
          </Group>
        )}

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
            <TextInput
              label="Column name"
              placeholder="e.g. user_id"
              required
              {...form.getInputProps('name')}
            />

            <Select
              label="Data type"
              placeholder="Select type"
              data={DATA_TYPES}
              required
              searchable
              {...form.getInputProps('dataType')}
            />

            {needsLength && (
              <NumberInput
                label="Length"
                placeholder="e.g. 255"
                min={1}
                max={65535}
                {...form.getInputProps('length')}
              />
            )}

            <Checkbox
              label="Nullable (can be NULL)"
              {...form.getInputProps('isNullable', { type: 'checkbox' })}
            />

            <TextInput
              label="Default value"
              placeholder="e.g. NULL, 0, 'text', CURRENT_TIMESTAMP"
              {...form.getInputProps('defaultValue')}
            />
          </Stack>
        </form>
      </AppShell.Section>

      <AppShell.Section mt="md">
        <Group justify="flex-end" gap="xs">
          <Button
            variant="default"
            onClick={handleCancel}
            leftSection={<IconX size={16} />}
          >
            Cancel
          </Button>
          <Button
            onClick={() => form.onSubmit(handleSubmit)()}
            leftSection={<IconCheck size={16} />}
          >
            {mode === 'add' ? 'Add Column' : 'Save Changes'}
          </Button>
        </Group>
      </AppShell.Section>
    </>
  );
}
