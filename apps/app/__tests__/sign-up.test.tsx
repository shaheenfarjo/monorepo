import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "../app/(unauthenticated)/sign-up/[[...sign-up]]/page";

test("sign-up asks for a name and a mobile number", () => {
  render(<Page />);

  expect(screen.getByLabelText("Full name")).toBeDefined();
  expect(screen.getByLabelText("Mobile number")).toBeDefined();
});
