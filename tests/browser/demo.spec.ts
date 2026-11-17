import { test, expect } from "@playwright/test";
test("recruiter journey: browse, filter, save, chat, draft, publish, reload and reset", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Explore demo →", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your next good find." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Furniture", exact: true }).click();
  await page.getByTestId("save-fixture-1").click();
  await expect(page.getByTestId("save-fixture-1")).toHaveAccessibleName(
    "Unsave listing: Teak & cane reading chair",
  );
  await page.getByRole("tab", { name: "Saved", exact: true }).click();
  await page
    .getByRole("link", { name: "Teak & cane reading chair", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Message seller", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Write a message…" })
    .fill("Hi, is this available?");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Simulated", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Sell", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Listing title" })
    .fill("My favorite reading chair");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A comfortable chair ready for a new home in the neighborhood.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Restore draft", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use a demo photo", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Use a demo photo 1", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("textbox", { name: "Price (৳)" }).fill("4500");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish locally", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "My favorite reading chair" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "My favorite reading chair" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Listing title" })
    .fill("My updated reading chair");
  for (let step = 0; step < 3; step++)
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "My updated reading chair" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Mark as sold", exact: true }).click();
  await expect(page.getByText("Sold", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Delete listing", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Make yourself at home" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your next good find." }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Saved", exact: true }).click();
  await expect(
    page.getByText("Tap the heart on a listing to keep it here."),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
