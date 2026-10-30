
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

  page.on("console", msg => console.log("BROWSER CONSOLE:", msg.type(), msg.text()));
  page.on("pageerror", error => console.log("BROWSER ERROR:", error.message));
  page.on("requestfailed", request =>
    console.log("REQUEST FAILED:", request.url(), request.failure()?.errorText)
  );
  page.on("response", response => {
    if (response.status() >= 400) {
      console.log("HTTP ERROR:", response.status(), response.url());
    }
  });

  console.log("Opening receptionist...");
  await page.goto(URL, { waitUntil: "domcontentloaded" });

  console.log("Starting call...");
  await page.getByRole("button", { name: "Start Call" }).click();

  console.log("Waiting 30 seconds...");
  await page.waitForTimeout(30000);

  console.log("VISIBLE PAGE TEXT:");
  console.log((await page.locator("body").innerText()).slice(0, 5000));

  await page.screenshot({ path: "/tmp/warmup-debug.png", fullPage: true });
  console.log("Screenshot saved.");

  await context.close();
} catch (error) {
  console.error("Warmup diagnostic failed:", error);
  process.exitCode = 1;
} finally {
  await browser.close();
}
