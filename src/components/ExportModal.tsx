import {
  Modal,
  Stack,
  Group,
  Checkbox,
  Radio,
  TextInput,
  NumberInput,
  Button,
  Text,
  ScrollArea,
  Divider,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useEffect } from 'react';
import { DataExportMode, ExportOptions } from '../types/database';
import { useQueryStore } from '../stores/queryStore';
import { open } from '@tauri-apps/plugin-dialog';

interface ExportModalProps {
  opened: boolean;
  onClose: () => void;
  onExport: (options: ExportOptions) => void;
  databaseName: string;
}

interface FormValues {
  includeDrop: boolean;
  includeCreate: boolean;
  dataMode: DataExportMode;
  fileName: string;
  outputPath: string;
  maxInsertSize: number;
  selectedTables: string[];
}

export function ExportModal({ opened, onClose, onExport, databaseName }: ExportModalProps) {
  const { tables } = useQueryStore();

  const form = useForm<FormValues>({
    initialValues: {
      includeDrop: false,
      includeCreate: true,
      dataMode: DataExportMode.Insert,
      fileName: `${databaseName}_export_${new Date().getTime()}.sql`,
      outputPath: '',
      maxInsertSize: 1000,
      selectedTables: [],
    },
    validate: {
      outputPath: (value) => (!value ? 'Please select an output path' : null),
      selectedTables: (value) => (value.length === 0 ? 'Please select at least one table' : null),
      maxInsertSize: (value) => (value < 1 || value > 10000 ? 'Must be between 1 and 10000' : null),
    },
  });

  useEffect(() => {
    if (tables && tables.length > 0 && form.values.selectedTables.length === 0) {
      form.setFieldValue('selectedTables', [...tables]);
    }
  }, [tables]);

  useEffect(() => {
    if (opened) {
      form.setFieldValue('fileName', `${databaseName}_export_${new Date().getTime()}.sql`);
    }
  }, [opened, databaseName]);

  const handleSelectAllTables = () => {
    if (tables) {
      form.setFieldValue('selectedTables', [...tables]);
    }
  };

  const handleDeselectAllTables = () => {
    form.setFieldValue('selectedTables', []);
  };

  const handleToggleTable = (tableName: string) => {
    const current = form.values.selectedTables;
    if (current.includes(tableName)) {
      form.setFieldValue('selectedTables', current.filter(t => t !== tableName));
    } else {
      form.setFieldValue('selectedTables', [...current, tableName]);
    }
  };

  const handleSelectOutputPath = async () => {
    try {
      const selectedPath = await open({
        directory: true,
        title: 'Select location to save SQL export',
      });

      if (selectedPath) {
        form.setFieldValue('outputPath', selectedPath);
      }
    } catch (error) {
      console.error('Path selection cancelled or failed:', error);
    }
  };

  const handleExport = () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    const options: ExportOptions = {
      includeDrop: form.values.includeDrop,
      includeCreate: form.values.includeCreate,
      dataMode: form.values.dataMode,
      selectedTables: form.values.selectedTables,
      outputPath: form.values.outputPath,
      fileName: form.values.fileName,
      maxInsertSize: form.values.maxInsertSize,
    };

    onExport(options);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Export Database"
      size="lg"
    >
      <Stack gap="md">
        {/* Structure Options */}
        <div>
          <Text fw={500} mb="xs">1. Structure (Co zrobic z tabelami?)</Text>
          <Stack gap="xs">
            <Checkbox
              label="Drop - Usuwa istniejace tabele przed ich utworzeniem"
              {...form.getInputProps('includeDrop', { type: 'checkbox' })}
            />
            <Checkbox
              label="Create - Tworzy strukture tabel (kolumny, typy danych, klucze)"
              {...form.getInputProps('includeCreate', { type: 'checkbox' })}
            />
          </Stack>
        </div>

        <Divider />

        {/* Data Options */}
        <div>
          <Text fw={500} mb="xs">2. Dane (Co zrobic z rekordami?)</Text>
          <Radio.Group
            {...form.getInputProps('dataMode')}
          >
            <Stack gap="xs">
              <Radio
                value={DataExportMode.NoData}
                label="No Data - Eksportuje tylko strukture (puste tabele)"
              />
              <Radio
                value={DataExportMode.Insert}
                label="Insert - Standardowy zapis danych (polecenia INSERT INTO)"
              />
              <Radio
                value={DataExportMode.Replace}
                label="Replace - Nadpisuje dane w przypadku duplikatow"
              />
              <Radio
                value={DataExportMode.InsertIgnore}
                label="Insert Ignore - Pomija bledy przy duplikatach"
              />
            </Stack>
          </Radio.Group>
        </div>

        <Divider />

        {/* Format Options */}
        <div>
          <Text fw={500} mb="xs">3. Cel i Format</Text>
          <Stack gap="xs">
            <TextInput
              label="Nazwa pliku"
              placeholder="database_export.sql"
              {...form.getInputProps('fileName')}
            />
            <Group align="flex-end">
              <TextInput
                label="Sciezka wyjsciowa"
                readOnly
                placeholder="Wybierz folder..."
                style={{ flex: 1 }}
                error={form.errors.outputPath}
                value={form.values.outputPath}
              />
              <Button onClick={handleSelectOutputPath}>Wybierz folder</Button>
            </Group>
            <NumberInput
              label="Max INSERT size (liczba wierszy na zapytanie)"
              min={1}
              max={10000}
              {...form.getInputProps('maxInsertSize')}
            />
          </Stack>
        </div>

        <Divider />

        {/* Table Selection */}
        <div>
          <Group justify="space-between" mb="xs">
            <Text fw={500}>4. Wybor tabel</Text>
            <Group gap="xs">
              <Button size="xs" variant="light" onClick={handleSelectAllTables}>
                Zaznacz wszystkie
              </Button>
              <Button size="xs" variant="light" onClick={handleDeselectAllTables}>
                Odznacz wszystkie
              </Button>
            </Group>
          </Group>
          {form.errors.selectedTables && (
            <Text c="red" size="sm" mb="xs">{form.errors.selectedTables}</Text>
          )}
          <ScrollArea h={200} style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px' }}>
            <Stack gap="xs">
              {tables && tables.length > 0 ? (
                tables.map((table) => (
                  <Checkbox
                    key={table}
                    label={table}
                    checked={form.values.selectedTables.includes(table)}
                    onChange={() => handleToggleTable(table)}
                  />
                ))
              ) : (
                <Text c="dimmed" size="sm">Brak dostepnych tabel</Text>
              )}
            </Stack>
          </ScrollArea>
        </div>

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          <Button variant="light" onClick={onClose}>Anuluj</Button>
          <Button onClick={handleExport}>Eksportuj</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
