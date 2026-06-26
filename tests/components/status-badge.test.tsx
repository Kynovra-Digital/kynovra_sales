import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/shared/status-badge";

describe("StatusBadge", () => {
  it("renders the provided status label", () => {
    render(<StatusBadge label="Base tecnica pronta" tone="blue" />);

    expect(screen.getByText("Base tecnica pronta")).toBeInTheDocument();
  });
});
