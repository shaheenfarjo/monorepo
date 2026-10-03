import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import Page from "../app/(unauthenticated)/sign-in/[[...sign-in]]/page";

test("sign-in asks for a mobile number", () => {
  render(<Page />);
  const phone = screen.getByLabelText("Mobile number");

  expect(phone.getAttribute("type")).toBe("tel");
  // Phone numbers stay left-to-right in the Arabic (RTL) UI.
  expect(phone.getAttribute("dir")).toBe("ltr");
  expect(screen.queryByLabelText("Full name")).toBeNull();
});
