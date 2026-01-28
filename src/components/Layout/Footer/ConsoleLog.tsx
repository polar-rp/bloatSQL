import { memo } from "react";
import { Box, Text, ScrollArea, ActionIcon, Tooltip, Stack } from "@mantine/core";
import { IconTrash } from "@tabler/icons-react";
import { useConsoleLogs, useClearLogs } from "../../../stores/consoleLogStore";

function ConsoleLogComponent() {
  const logs = useConsoleLogs();
  const clearLogs = useClearLogs();

  return (
    <Box
      w="100%"
      style={{ borderTop: '1px solid var(--mantine-color-default-border)', position: 'relative' }}
      bg="var(--mantine-color-default)"
    >
      <ScrollArea h={239}>
        {logs.length === 0 ? (
          <Text size="xs" c="dimmed" ta="center" py="md">
            No actions yet
          </Text>
        ) : (
          <Stack gap="xs" p="xs" px="md">
            {logs.map((log) => (
              <Box key={log.id}>
                <Text
                  size="xs"
                  c="dimmed"
                  fw={500}
                  lh={1.4}
                  ff="'Consolas', 'Monaco', 'Courier New', monospace"
                >
                  -- {log.timestamp}
                </Text>
                <Text
                  size="xs"
                  lh={1.4}
                  ff="'Consolas', 'Monaco', 'Courier New', monospace"
                  style={{ wordBreak: 'break-word' }}
                >
                  {log.action}
                </Text>
              </Box>
            ))}
          </Stack>
        )}
      </ScrollArea>

      {logs.length > 0 && (
        <Box pos={'absolute'} top={18} right={18} style={{  zIndex: 10 }}>
          <Tooltip label="Clear logs">
            <ActionIcon
              variant="light"
              onClick={clearLogs}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

export const ConsoleLog = memo(ConsoleLogComponent);
