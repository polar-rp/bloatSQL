import { ReactNode } from "react";
import { Box, Group, Text, UnstyledButton } from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { useSelectedTable } from "../../../stores/tableViewStore";
import classes from "./Toolbar.module.css";

interface ToolbarProps {
  toolbarContent?: ReactNode;
  onNavigateBack?: () => void;
  onNavigateForward?: () => void;
}

export function Toolbar({
  toolbarContent,
  onNavigateBack,
  onNavigateForward,
}: ToolbarProps) {
  const selectedTable = useSelectedTable();

  return (
    <Box
      h={30}
      style={{
        borderBottom: "1px solid var(--mantine-color-default-border)",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Group gap={0} >
        <UnstyledButton
          onClick={onNavigateBack}
          disabled={!onNavigateBack}
          className={classes.toolbarButton}
        >
          <IconChevronLeft size={16} />
        </UnstyledButton>

        <UnstyledButton
          onClick={onNavigateForward}
          disabled={!onNavigateForward}
          className={classes.toolbarButton}
        >
          <IconChevronRight size={16} />
        </UnstyledButton>
      </Group>

      {(toolbarContent || selectedTable) && (
        <Box flex={1} ta={'center'}>
          {toolbarContent ?? (
            <Text size="sm" fw={500}>
              {selectedTable}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}