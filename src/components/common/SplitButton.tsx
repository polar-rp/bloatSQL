import { Button, Menu, ActionIcon, Group, rem } from '@mantine/core';
import { IconChevronDown } from '@tabler/icons-react';
import { ReactNode } from 'react';

export interface SplitButtonMenuItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  disabled?: boolean;
}

interface SplitButtonProps {
  /** Main button label */
  label: string;
  /** Main button click handler */
  onClick: () => void;
  /** Dropdown menu items */
  menuItems: SplitButtonMenuItem[];
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Button variant */
  variant?: string;
  /** Disable both button and menu */
  disabled?: boolean;
  /** Icon on the left side of main button */
  leftSection?: ReactNode;
  /** Content on the right side of main button (icon, kbd, etc.) */
  rightSection?: ReactNode;
  /** Loading state for main button */
  loading?: boolean;
}

export function SplitButton({
  label,
  onClick,
  menuItems,
  size = 'xs',
  variant = 'default',
  disabled = false,
  leftSection,
  rightSection,
  loading = false,
}: SplitButtonProps) {
  return (
    <Group gap={0}>
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={disabled}
        loading={loading}
        leftSection={leftSection}
        rightSection={rightSection}
        styles={{
          root: {
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
            borderRight: 0,
            paddingLeft: size === 'xs' ? rem(10) : undefined,
            paddingRight: size === 'xs' ? rem(10) : undefined,
          },
        }}
      >
        {label}
      </Button>

      <Menu position="bottom-end" transitionProps={{ transition: 'pop' }} withinPortal>
        <Menu.Target>
          <ActionIcon
            variant={variant}
            size={size === 'xs' ? 30 : size === 'sm' ? 36 : 42}
            disabled={disabled}
            styles={{
              root: {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderLeft: `${rem(1)} solid var(--mantine-color-default-border)`,
              },
            }}
          >
            <IconChevronDown style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          {menuItems.map((item, index) => (
            <Menu.Item
              key={index}
              onClick={item.onClick}
              disabled={item.disabled}
              leftSection={item.icon}
            >
              {item.label}
            </Menu.Item>
          ))}
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
