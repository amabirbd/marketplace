import { test, expect } from "@playwright/test";
test("failed saves roll back and failed chat retries do not duplicate", async ({
  page,
}) => {
  await page.goto("/profile");
  await page
    .getByRole("button", { name: "Fail next save", exact: true })
    .click();
  await page.getByRole("tab", { name: "Explore", exact: true }).click();
  await page.getByTestId("save-fixture-1").click();
  await expect(page.getByTestId("save-fixture-1")).toHaveAccessibleName(
    "Save listing: Teak & cane reading chair",
  );
  await expect(page.getByRole("alert")).toBeVisible();
  await page.getByRole("tab", { name: "Profile", exact: true }).click();
  await page
    .getByRole("button", { name: "Fail next message", exact: true })
    .click();
  await page.getByRole("tab", { name: "Explore", exact: true }).click();
  await page
    .getByRole("link", { name: "Teak & cane reading chair", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Message seller", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Write a message…" })
    .fill("Retry this exact message");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Failed · retry", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByText("Simulated", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Retry this exact message", { exact: true }),
  ).toHaveCount(1);
});
test("theme and Bangla survive reload; reduced motion and narrow layout do not overflow", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/profile");
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "বাংলা", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "নিজের মতো সাজান" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "নিজের মতো সাজান" }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "ঘুরে দেখুন", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "আপনার পরের পছন্দ।" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "নতুন আগে", exact: true }).first(),
  ).toBeVisible();
});
test("browser photo blobs persist across restart and an offline session can save locally", async ({
  page,
  context,
}) => {
  await page.goto("/sell");
  await page
    .getByRole("textbox", { name: "Listing title" })
    .fill("A lamp from my room");
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("A nice working bedside lamp ready for a new home.");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "Choose a photo", exact: true })
    .click();
  await (await chooser).setFiles("assets/images/lamp.jpg");
  await expect(
    page.getByRole("button", { name: "Remove photo 1", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Restore draft", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page
    .getByRole("button", { name: "Publish locally", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A lamp from my room" }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "A lamp from my room" }),
  ).toBeVisible();
  await context.setOffline(true);
  await expect(
    page.getByText("You’re offline. The local demo still works."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Save listing", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Unsave listing", exact: true }),
  ).toBeVisible();
  await context.setOffline(false);
});
