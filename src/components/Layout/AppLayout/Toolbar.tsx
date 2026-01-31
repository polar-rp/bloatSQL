import { ReactNode } from "react";
import { Box, Group, Text, Tooltip, UnstyledButton, Kbd } from "@mantine/core";
import { IconArrowNarrowLeft, IconArrowNarrowRight } from "@tabler/icons-react";
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
        <Tooltip
          ta={'center'}
          label={
            <>
              Back 
              <br />
              <Kbd>Alt</Kbd> <Kbd>←</Kbd>
            </>
          }
          withArrow
          arrowPosition="side"
          multiline
        >
          <UnstyledButton
            onClick={onNavigateBack}
            disabled={!onNavigateBack}
            className={classes.toolbarButton}
          >
            <IconArrowNarrowLeft size={20} />
          </UnstyledButton>
        </Tooltip>
        
        <Tooltip
            ta={'center'}
            label={
              <>
                Next
                <br />
                <Kbd>Alt</Kbd> <Kbd>→</Kbd>
              </>
            }
            withArrow
            multiline
          >
          <UnstyledButton
            onClick={onNavigateForward}
            disabled={!onNavigateForward}
            className={classes.toolbarButton}
          >
            <IconArrowNarrowRight size={20} />
          </UnstyledButton>
        </Tooltip>
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