'use client';

import ChecklistLauncher from './ChecklistLauncher';
import OnboardingCelebration from './OnboardingCelebration';
import SpotlightTour from './SpotlightTour';
import WelcomeModal from './WelcomeModal';

/** All global onboarding overlays, mounted once inside OnboardingProvider. */
export default function OnboardingRoot() {
    return (
        <>
            <WelcomeModal />
            <SpotlightTour />
            <ChecklistLauncher />
            <OnboardingCelebration />
        </>
    );
}
