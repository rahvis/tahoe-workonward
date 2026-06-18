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
        <Dialog.Root open={showWelcome} onOpenChange={(open) => { if (!open && state.tour_status === 'pending') skip(); }}>
            <Dialog.Content maxWidth="460px" aria-label="Welcome to Tahoe">
                <Dialog.Title>Find anyone in 800M+ profiles — in your own words</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                    Take a quick 60-second tour of how Tahoe finds, verifies, and reaches candidates.
                </Dialog.Description>

                <Text as="p" size="2" weight="medium" mb="2">What are you hiring for right now? (optional)</Text>
                <Flex gap="2" wrap="wrap" mb="5">
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

                <Flex direction="column" gap="2">
                    <Button size="3" onClick={startTour}>Take the 60-second tour →</Button>
                    <Button variant="ghost" color="gray" onClick={skip}>Skip for now</Button>
                </Flex>
            </Dialog.Content>
        </Dialog.Root>
    );
}
