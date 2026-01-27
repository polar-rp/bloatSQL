import { Modal, Select, Stack, Text, Group, ColorSwatch, useMantineTheme, CheckIcon, Center, Slider } from '@mantine/core';
import { usePrimaryColor, useColorScheme, useDefaultRadius, useSetPrimaryColor, useSetColorScheme, useSetDefaultRadius } from '../../../stores/settingsStore';

interface SettingsModalProps {
    opened: boolean;
    onClose: () => void;
}

const colors = [
    'dark', 'gray', 'red', 'pink', 'grape', 'violet', 'indigo', 'blue',
    'cyan', 'teal', 'green', 'lime', 'yellow', 'orange'
];

const radiusValues = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export function SettingsModal({ opened, onClose }: SettingsModalProps) {
    const primaryColor = usePrimaryColor();
    const colorScheme = useColorScheme();
    const defaultRadius = useDefaultRadius();
    const setPrimaryColor = useSetPrimaryColor();
    const setColorScheme = useSetColorScheme();
    const setDefaultRadius = useSetDefaultRadius();
    const theme = useMantineTheme();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Settings"
            centered
            size="md"
            overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
            }}
        >
            <Stack gap="xl">
                <Stack gap="xs">
                    <Text size="sm" fw={500}>Appearance</Text>
                    <Select
                        label="Theme Mode"
                        placeholder="Pick value"
                        data={[
                            { value: 'light', label: 'Light' },
                            { value: 'dark', label: 'Dark' },
                            { value: 'auto', label: 'Auto' },
                        ]}
                        value={colorScheme}
                        onChange={(value) => setColorScheme(value as any)}
                    />
                </Stack>

                <Stack gap="xs">
                    <Text size="sm" fw={500}>Border Radius</Text>
                    <Slider
                        value={radiusValues.indexOf(defaultRadius)}
                        onChange={(val) => setDefaultRadius(radiusValues[val])}
                        min={0}
                        max={4}
                        step={1}
                        label={(val) => radiusValues[val]}
                        marks={radiusValues.map((v, i) => ({ value: i, label: v }))}
                        mb="xl"
                    />
                </Stack>

                <Stack gap="xs">
                    <Text size="sm" fw={500}>Primary Color</Text>
                    <Group gap="xs" justify="center">
                        {colors.map((color) => (
                            <ColorSwatch
                                key={color}
                                color={theme.colors[color][6]}
                                component="button"
                                onClick={() => setPrimaryColor(color)}
                            >
                                {primaryColor === color && (
                                    <Center>
                                        <CheckIcon style={{ width: '0.8rem', height: '0.8rem' }} />
                                    </Center>
                                )}
                            </ColorSwatch>
                        ))}
                    </Group>
                </Stack>
            </Stack>
        </Modal>
    );
}
