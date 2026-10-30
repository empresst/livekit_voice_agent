import { chromium } from "playwright";

const URL = "https://livekit-voice-agent-five.vercel.app";

const browser = await chromium.launch({
  headless: true,
  args: [
    "--use-fake-device-for-media-stream",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
  ],
});

try {
  const context = await browser.newContext({
    permissions: ["microphone"],
  });

  const page = await context.newPage();

  console.log("Opening receptionist...");
  await page.goto(URL, { waitUntil: "domcontentloaded" });

  console.log("Starting call...");
  await page.getByRole("button", { name: "Start Call" }).click();

  console.log("Waiting for LiveKit connection...");
  await page.getByText("Connected – speak now", {
    exact: true,
  }).waitFor({ state: "visible", timeout: 90000 });

  console.log("Connected. Allowing greeting to play...");
  await page.waitForTimeout(8000);

  await page.getByRole("button", { name: "End Call" }).click();

  console.log("Warmup call ended successfully.");
  await context.close();
} catch (error) {
  console.error("Warmup failed:", error);
  process.exitCode = 1;
} finally {
  await browser.close();
}