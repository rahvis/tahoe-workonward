'use client';

import { Button, Dialog, Flex, Text } from '@/components/ui/tahoe-ui';
import type { OnboardingSegment } from '@/lib/onboarding';
import { useOnboarding } from './OnboardingProvider';

const SEGMENTS: { id: OnboardingSegment; label: string }[] = [
    { id: 'engineering', label: 'Engineering' },
    { id: 'design', label: 'Design' },
    { id: 'sales', label: 'Sales' },
    { id: 'other', label: 'Other' },
];

export default function WelcomeModal() {
    const { showWelcome, setSegment, startTour, skip, state } = useOnboarding();

    return (
        <Dialog.Root
            open={showWelcome}
            onOpenChange={(open) => {
                // Dismiss on Esc/backdrop for pending or re-prompted (skipped) users.
                // After "Take the tour" status is 'in_progress', so this won't fire.
                if (!open && (state.tour_status === 'pending' || state.tour_status === 'skipped')) skip();
            }}
        >
            <Dialog.Content maxWidth="480px" aria-label="Welcome to Tahoe" style={{ padding: 32 }}>
                <Dialog.Title>Find anyone in 800M+ profiles — in your own words</Dialog.Title>
                <Dialog.Description size="2" mb="5">
                    Take a quick 60-second tour of how Tahoe finds, verifies, and reaches candidates.
                </Dialog.Description>

                <Text as="p" size="2" weight="medium" mb="3">What are you hiring for right now? (optional)</Text>
                <Flex gap="2" wrap="wrap" mb="6">
                    {SEGMENTS.map((s) => (
                        <Button
                            key={s.id}
                            variant={state.segment === s.id ? 'solid' : 'soft'}
                            color={state.segment === s.id ? undefined : 'gray'}
                            onClick={() => setSegment(s.id)}
                        >
                            {s.label}
                        </Button>
                    ))}
                </Flex>

                <Flex direction="column" gap="3">
                    <Button size="3" onClick={startTour}>Take the 60-second tour →</Button>
                    <Button variant="ghost" color="gray" onClick={skip}>Skip for now</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
