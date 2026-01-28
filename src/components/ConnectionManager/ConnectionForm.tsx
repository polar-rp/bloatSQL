import {
  Stack,
  TextInput,
  PasswordInput,
  NumberInput,
  Select,
  Button,
  Group,
  Alert,
  Card,
  Divider,
  Text,
  ActionIcon,
  Flex,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconDownload } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { Connection, DatabaseType } from '../../types/database';
import { useConnectionStore } from '../../stores/connectionStore';

interface ConnectionFormProps {
  connection?: Connection;
  onSuccess: () => void;
}

interface FormValues {
  name: string;
  dbType: DatabaseType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  sslMode: 'disabled' | 'preferred' | 'required';
}

export function ConnectionForm({ connection, onSuccess }: ConnectionFormProps) {
  const { saveConnection, testConnection, isLoading, error } = useConnectionStore();

  const [testError, setTestError] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      name: connection?.name || '',
      dbType: connection?.dbType || DatabaseType.MariaDB,
      host: connection?.host || 'localhost',
      port: connection?.port || 3306,
      username: connection?.username || 'root',
      password: connection?.password || '',
      database: connection?.database || '',
      sslMode: connection?.sslMode || 'preferred',
    },
    validate: {
      name: (value) => (!value ? 'Connection name is required' : null),
      host: (value) => (!value ? 'Host is required' : null),
      username: (value) => (!value ? 'Username is required' : null),
      database: (value) => (!value ? 'Database name is required' : null),
      port: (value) => (value <= 0 || value > 65535 ? 'Invalid port number' : null),
    },
  });

  useEffect(() => {
    const defaultPorts: Record<DatabaseType, number> = {
      [DatabaseType.MariaDB]: 3306,
      [DatabaseType.PostgreSQL]: 5432,
    };

    const currentPort = form.values.port;
    const expectedPort = defaultPorts[form.values.dbType];

    const isDefaultPort = Object.values(defaultPorts).includes(currentPort);
    if (isDefaultPort && currentPort !== expectedPort) {
      form.setFieldValue('port', expectedPort);
    }
  }, [form.values.dbType]);

  const handleImport = () => {
    setImportError(null);
    if (!importUrl) return;

    try {
      let urlString = importUrl;
      if (!importUrl.includes('://')) {
        urlString = importUrl.toLowerCase().startsWith('postgres')
          ? `postgresql://${importUrl}`
          : `mysql://${importUrl}`;
      }
      const url = new URL(urlString);

      const values: Partial<FormValues> = {};

      if (url.protocol === 'postgresql:') {
        values.dbType = DatabaseType.PostgreSQL;
      } else if (url.protocol === 'mysql:') {
        values.dbType = DatabaseType.MariaDB;
      }

      if (url.hostname) values.host = url.hostname;
      if (url.port) values.port = parseInt(url.port, 10);
      if (url.username) values.username = url.username;
      if (url.password) values.password = url.password;
      if (url.pathname && url.pathname.length > 1) values.database = url.pathname.substring(1);

      const sslParam = url.searchParams.get('ssl-mode') || url.searchParams.get('ssl');
      if (sslParam) {
        const mode = sslParam.toLowerCase();
        if (['disabled', 'preferred', 'required'].includes(mode)) {
          values.sslMode = mode as any;
        }
      }

      if (!form.values.name && values.host) {
        values.name = values.database ? `${values.database} on ${values.host}` : values.host;
      }

      form.setValues((prev) => ({ ...prev, ...values }));
    } catch (e) {
      setImportError('Invalid connection URL');
    }
  };

  const handleTest = async () => {
    setTestError(null);
    setTestSuccess(false);

    const validation = form.validate();
    if (validation.hasErrors) return;

    try {
      const connectionData: Connection = {
        id: connection?.id || '',
        ...form.values,
      };
      await testConnection(connectionData);
      setTestSuccess(true);
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Test failed');
    }
  };

  const handleSave = async () => {
    const validation = form.validate();
    if (validation.hasErrors) return;

    try {
      await saveConnection({
        id: connection?.id,
        ...form.values,
      });
      onSuccess();
    } catch (err) {
      console.error('Failed to save connection:', err);
    }
  };

  return (
    <Stack gap="md">
      {error && (
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red">
          {error}
        </Alert>
      )}

      {testError && (
        <Alert icon={<IconAlertCircle size={16} />} title="Connection Test Failed" color="red">
          {testError}
        </Alert>
      )}

      {testSuccess && (
        <Alert color="green">Connection successful!</Alert>
      )}

      {/* Import Card */}
      <Card withBorder padding="sm">
        <Stack gap="xs">
          <Text size="sm" fw={500}>Import from URL</Text>
          <Group gap="xs" align="flex-start">
            <TextInput
              placeholder="mysql://user:pass@host:port/db or postgresql://..."
              style={{ flex: 1 }}
              value={importUrl}
              onChange={(e) => setImportUrl(e.currentTarget.value)}
              error={importError}
              rightSection={
                <ActionIcon variant="light" onClick={handleImport} title="Import">
                  <IconDownload size={16} />
                </ActionIcon>
              }
            />
          </Group>
        </Stack>
      </Card>

      <Divider label="or fill manually" labelPosition="center" />

      <Select
        label="Database Type"
        data={[
          { value: DatabaseType.MariaDB, label: 'MariaDB / MySQL' },
          { value: DatabaseType.PostgreSQL, label: 'PostgreSQL' },
        ]}
        {...form.getInputProps('dbType')}
      />

      <TextInput
        label="Connection Name"
        placeholder="My Database"
        required
        {...form.getInputProps('name')}
      />

      <Flex gap="md">
        <TextInput
          label="Host"
          placeholder="localhost"
          required
          flex={1}
          {...form.getInputProps('host')}
        />
        <NumberInput
          label="Port"
          placeholder="3306"
          required
          w={90}
          {...form.getInputProps('port')}
        />
      </Flex>

      <TextInput
        label="Database Name"
        placeholder="mydb"
        required
        {...form.getInputProps('database')}
      />

      <Group grow>
        <TextInput
          label="Username"
          placeholder="root"
          required
          {...form.getInputProps('username')}
        />
        <PasswordInput
          label="Password"
          placeholder="Enter password"
          {...form.getInputProps('password')}
        />
      </Group>

      <Select
        label="SSL Mode"
        data={[
          { value: 'disabled', label: 'Disabled' },
          { value: 'preferred', label: 'Preferred' },
          { value: 'required', label: 'Required' },
        ]}
        {...form.getInputProps('sslMode')}
      />

      <Group justify="flex-end" mt="md">
        <Button
          variant="light"
          onClick={handleTest}
          loading={isLoading}
        >
          Test Connection
        </Button>
        <Button
          onClick={handleSave}
          loading={isLoading}
        >
          Save Connection
        </Button>
      </Group>
    </Stack>
  );
}
