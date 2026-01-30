import { memo } from "react";
import { Box, Text, ScrollArea, ActionIcon, Tooltip, Stack, Center, ThemeIcon } from "@mantine/core";
import { IconTrash, IconTerminal2 } from "@tabler/icons-react";
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
      <ScrollArea h={239} scrollbars="y" type="hover">
        {logs.length === 0 ? (
          <Center h={239}>
            <Stack gap="xs" align="center">
              <ThemeIcon variant="transparent" color="gray" size="xl">
                <IconTerminal2 stroke={1.5} size={32} />
              </ThemeIcon>
              <Box ta="center">
                <Text size="sm" fw={500} c="dimmed">
                  No activity detected
                </Text>
                <Text size="xs" c="dimmed" opacity={0.7}>
                  Wait for actions to appear in the console.
                </Text>
              </Box>
            </Stack>
          </Center>
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
        <Box pos={'absolute'} top={12} right={12} style={{ zIndex: 10 }}>
          <Tooltip label="Clear logs" withArrow position="left">
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={clearLogs}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Box>
      )}
    </Box>
  );
}

export const ConsoleLog = memo(ConsoleLogComponent);