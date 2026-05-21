import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PreviewCapBanner, { buildPreviewCapMessage } from "./preview-cap-banner";

describe("PreviewCapBanner", () => {
    test("renders the canonical preview-cap copy", () => {
        render(<PreviewCapBanner totalResults={1234} previewTotalResults={100} totalPages={5} />);
        expect(screen.getByText("Found 1,234 matches")).toBeInTheDocument();
    });

    test("renders nothing when there are no results", () => {
        const { container } = render(
            <PreviewCapBanner totalResults={0} previewTotalResults={0} totalPages={1} />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    test("buildPreviewCapMessage formats total result count", () => {
        const message = buildPreviewCapMessage({
            previewTotalResults: 9999,
            totalResults: 50000,
            totalPages: 10,
        });
        expect(message).toBe("Found 50,000 matches");
    });
});
