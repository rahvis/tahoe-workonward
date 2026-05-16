import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

vi.mock("vanilla-cookieconsent", () => ({
    run: vi.fn(() => Promise.resolve()),
    hide: vi.fn(),
    hidePreferences: vi.fn(),
    showPreferences: vi.fn(),
    reset: vi.fn(),
}));
