import {
  ActionIcon,
  Box,
  Group,
  useComputedColorScheme,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconMoon,
  IconSun,
} from "@tabler/icons-react";
import cx from "clsx";
import { EditorTabs } from "../../QueryEditor";
import { QueryWorkspace } from "../../QueryWorkspace";
import classes from "../../../App.module.css";

type MainContentProps = {
  queryText: string;
  handleQueryChange: (query: string) => void;
  handleExecute: () => void;
  isExecuting: boolean;
  isConnected: boolean;
  results: any;
  error: string | null;
  clearError: () => void;
  lastExecutionTime: number | null;
  isTableTransitionPending: boolean;
};

export function MainContent({
  queryText,
  handleQueryChange,
  handleExecute,
  isExecuting,
  isConnected,
  results,
  error,
  clearError,
  lastExecutionTime,
  isTableTransitionPending,
}: MainContentProps) {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light", {
    getInitialValueInEffect: true,
  });

  return (
    <>
      <Group justify="flex-end" mb="md">
        <ActionIcon
          onClick={() =>
            setColorScheme(computedColorScheme === "light" ? "dark" : "light")
          }
          variant="subtle"
          size="lg"
          aria-label="Toggle color scheme"
        >
          <IconSun className={cx(classes.icon, classes.light)} stroke={1.5} />
          <IconMoon className={cx(classes.icon, classes.dark)} stroke={1.5} />
        </ActionIcon>
      </Group>

      <EditorTabs />

      <Box
        mt="md"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
        }}
      >
        <QueryWorkspace
          query={queryText}
          onQueryChange={handleQueryChange}
          onExecute={handleExecute}
          isExecuting={isExecuting || isTableTransitionPending}
          isConnected={isConnected}
          results={results}
          error={error}
          onClearError={clearError}
          lastExecutionTime={lastExecutionTime}
        />
      </Box>
    </>
  );
}
