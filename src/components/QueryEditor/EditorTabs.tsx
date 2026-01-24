import { Tabs, ActionIcon } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import {
  useTabs,
  useActiveTab,
  useSetActiveTab,
  useAddTab,
  useCloseTab,
} from '../../stores/tabsStore';

export function EditorTabs() {
  const tabs = useTabs();
  const activeTab = useActiveTab();
  const setActiveTab = useSetActiveTab();
  const addTab = useAddTab();
  const closeTab = useCloseTab();

  const handleClose = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  return (
    <Tabs
      value={activeTab}
      onChange={(value) => value && setActiveTab(value)}
      style={{
        borderBottom: `1px solid var(--mantine-color-default-border)`,
      }}
    >
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Tab
            key={tab.id}
            value={tab.id}
            rightSection={
              tabs.length > 1 ? (
                <ActionIcon color='gray'  size={'xs'} variant='subtle' aria-label="Close card" onClick={(e) => handleClose(tab.id, e)}>
                  <IconX  stroke={1.5} />
                </ActionIcon>

              ) : null
            }
          >
            {tab.title}
          </Tabs.Tab>
        ))}
        <Tabs.Tab value="add" onClick={addTab}>
          <IconPlus size={16} />
        </Tabs.Tab>
      </Tabs.List>
    </Tabs>
  );
}
