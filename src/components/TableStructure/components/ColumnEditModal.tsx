import { Modal, TextInput, Select, NumberInput, Checkbox, Button, Group, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { DisplayColumn, ColumnDefinition } from '../../../types/tableStructure';

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

interface ColumnEditModalProps {
  opened: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  column?: DisplayColumn | null;
  onSave: (definition: ColumnDefinition, originalName?: string) => void;
}

export function ColumnEditModal({
  opened,
  onClose,
  mode,
  column,
  onSave,
}: ColumnEditModalProps) {
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
    if (opened) {
      if (mode === 'edit' && column) {
        form.setValues({
          name: column.name,
          dataType: column.parsed.baseType.toUpperCase(),
          length: column.characterMaximumLength ?? '',
          isNullable: column.isNullable,
          defaultValue: column.columnDefault ?? '',
        });
      } else {
        form.reset();
      }
    }
  }, [opened, mode, column]);

  const handleSubmit = (values: ColumnFormValues) => {
    const definition: ColumnDefinition = {
      name: values.name.trim(),
      dataType: values.dataType,
      length: values.length === '' ? undefined : values.length,
      isNullable: values.isNullable,
      isPrimaryKey: column?.isPrimaryKey ?? false,
      defaultValue: values.defaultValue.trim() || null,
    };

    onSave(definition, mode === 'edit' ? column?.name : undefined);
    onClose();
  };

  const needsLength = ['VARCHAR', 'CHAR', 'DECIMAL', 'INT', 'BIGINT', 'SMALLINT', 'TINYINT'].includes(
    form.values.dataType
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={mode === 'add' ? 'Add new column' : `Edit column: ${column?.name}`}
      size="md"
    >
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

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {mode === 'add' ? 'Add column' : 'Save changes'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
