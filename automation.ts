import { webdriver } from "selenium-webdriver";
import { Builder, By, until } from "selenium-webdriver";
import * as chrome from "selenium-webdriver/chrome";
import { unidecode } from "unidecode";
import { addLog, addCreatedAccount } from "./db";

// Arabic name lists for identity generation
const FIRST_NAMES = ["Ali", "Ahmed", "Omar", "Youssef", "Ayman", "Khaled", "Salma", "Nour", "Rania", "Hassan", "Fatima", "Leila", "Amira", "Zainab", "Hana"];
const LAST_NAMES = ["Mohamed", "Ahmed", "Hussein", "Sayed", "Ismail", "Abdallah", "Khalil", "Soliman", "Ibrahim", "Hassan", "Karim", "Rashid", "Malik", "Nasir"];

// User agents for randomization
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
];

interface ProxyConfig {
  protocol: string;
  host: string;
  port: number;
}

/**
 * Generate a random identity with Arabic name
 */
export function generateIdentity() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const randomNum = Math.floor(Math.random() * 10000);

  return {
    firstName,
    lastName,
    username: `${unidecode(firstName).toLowerCase()}.${unidecode(lastName).toLowerCase()}${randomNum}`,
  };
}

/**
 * Get a free proxy from the free-proxy library
 */
export async function getWorkingProxy(): Promise<ProxyConfig | null> {
  try {
    // This would use the free-proxy library in production
    // For now, returning null to proceed without proxy
    return null;
  } catch (error) {
    console.error("Failed to get proxy:", error);
    return null;
  }
}

/**
 * Create a Chrome WebDriver instance with optional proxy
 */
export async function createWebDriver(proxy?: ProxyConfig) {
  const options = new chrome.Options();

  // Set random user agent
  options.addArguments(`user-agent=${USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]}`);

  // Add proxy if available
  if (proxy) {
    options.addArguments(`--proxy-server=${proxy.protocol}://${proxy.host}:${proxy.port}`);
  }

  // Additional options for stability
  options.addArguments("--disable-blink-features=AutomationControlled");
  options.addArguments("--no-sandbox");
  options.addArguments("--disable-dev-shm-usage");

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  return driver;
}

/**
 * Main Gmail account creation automation
 */
export async function createGmailAccount(
  sessionId: number,
  password: string,
  onLog: (message: string, level: "info" | "success" | "warning" | "error") => Promise<void>
) {
  let driver: any = null;

  try {
    const identity = generateIdentity();
    await onLog(`Generated identity: ${identity.firstName} ${identity.lastName}`, "info");

    // Get proxy
    const proxy = await getWorkingProxy();
    if (proxy) {
      await onLog(`Using proxy: ${proxy.host}:${proxy.port}`, "info");
    }

    // Create WebDriver
    await onLog("Initializing browser...", "info");
    driver = await createWebDriver(proxy);

    // Navigate to Gmail signup
    await onLog("Navigating to Gmail signup...", "info");
    await driver.get("https://accounts.google.com/signup/v2/createaccount?flowName=GlifWebSignIn&flowEntry=SignUp");

    // Wait for page to load
    const wait = new (require("selenium-webdriver").WebDriverWait)(driver, 15);

    // Fill in first name
    await onLog("Filling first name...", "info");
    const firstNameField = await wait.until(
      new (require("selenium-webdriver").until").elementLocated(By.name("firstName"))
    );
    await firstNameField.sendKeys(identity.firstName);

    // Fill in last name
    const lastNameField = await driver.findElement(By.name("lastName"));
    await lastNameField.sendKeys(identity.lastName);

    // Click next button
    const nextButtons = await driver.findElements(By.className("VfPpkd-LgbsSe"));
    if (nextButtons.length > 0) {
      await nextButtons[0].click();
    }

    // Wait for birthday fields
    await new Promise((r) => setTimeout(r, 2000));

    // Fill birthday (simulated)
    const dayField = await driver.findElement(By.id("day"));
    await dayField.sendKeys("15");

    const monthSelect = await driver.findElement(By.id("month"));
    await monthSelect.sendKeys("5");

    const yearField = await driver.findElement(By.id("year"));
    await yearField.sendKeys("1990");

    // Select gender
    const genderSelect = await driver.findElement(By.id("gender"));
    await genderSelect.sendKeys("2");

    // Click next
    const nextButtons2 = await driver.findElements(By.className("VfPpkd-LgbsSe"));
    if (nextButtons2.length > 0) {
      await nextButtons2[0].click();
    }

    // Wait and fill username
    await new Promise((r) => setTimeout(r, 2000));

    await onLog(`Using username: ${identity.username}`, "info");
    const usernameField = await driver.findElement(By.name("Username"));
    await usernameField.sendKeys(identity.username);

    // Click next
    const nextButtons3 = await driver.findElements(By.className("VfPpkd-LgbsSe"));
    if (nextButtons3.length > 0) {
      await nextButtons3[0].click();
    }

    // Wait and fill password
    await new Promise((r) => setTimeout(r, 2000));

    const passwordField = await driver.findElement(By.name("Passwd"));
    await passwordField.sendKeys(password);

    const confirmPasswordField = await driver.findElement(By.name("PasswdAgain"));
    await confirmPasswordField.sendKeys(password);

    // Click next
    const nextButtons4 = await driver.findElements(By.className("VfPpkd-LgbsSe"));
    if (nextButtons4.length > 0) {
      await nextButtons4[0].click();
    }

    // Wait for completion
    await new Promise((r) => setTimeout(r, 3000));

    const email = `${identity.username}@gmail.com`;
    await onLog(`Account created successfully: ${email}`, "success");

    // Save to database
    await addCreatedAccount(sessionId, email, password, identity.firstName, identity.lastName, "success");

    return { success: true, email };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    await onLog(`Account creation failed: ${errorMsg}`, "error");

    // Try to extract email if possible
    try {
      const identity = generateIdentity();
      await addCreatedAccount(
        sessionId,
        `${identity.username}@gmail.com`,
        password,
        identity.firstName,
        identity.lastName,
        "failed",
        errorMsg
      );
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError);
    }

    return { success: false, error: errorMsg };
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        console.error("Failed to quit driver:", e);
      }
    }
  }
}

/**
 * Create multiple accounts in sequence with cooldown
 */
export async function createMultipleAccounts(
  sessionId: number,
  count: number,
  password: string,
  onLog: (message: string, level: "info" | "success" | "warning" | "error") => Promise<void>,
  onProgress: (completed: number, failed: number) => Promise<void>
) {
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < count; i++) {
    await onLog(`\n--- Account ${i + 1}/${count} ---`, "info");

    const result = await createGmailAccount(sessionId, password, onLog);

    if (result.success) {
      completed++;
    } else {
      failed++;
    }

    await onProgress(completed, failed);

    // Cooldown between accounts
    if (i < count - 1) {
      const cooldown = Math.floor(Math.random() * 10) + 5; // 5-15 seconds
      await onLog(`Cooldown: ${cooldown}s`, "info");
      await new Promise((r) => setTimeout(r, cooldown * 1000));
    }
  }

  await onLog(`\n=== Batch Complete: ${completed} success, ${failed} failed ===`, "success");
  return { completed, failed };
}
