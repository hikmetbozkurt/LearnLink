const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * LL-TC-020 - Open Settings Tabs
 */
async function runSettingsTabsTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('🔧 Starting Test: Open Settings Tabs');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'test@test.com';
    const testPassword = 'Test1234';

    // Login
    await driver.get(testUrl);
    await driver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log(' Logged in successfully');

    try {
      const toast = await driver.wait(until.elementLocated(By.css('.toast.success')), 5000);
      await driver.executeScript("arguments[0].remove();", toast);
      console.log('Toast dismissed');
    } catch {}

    // Open Settings
    const settingsIcon = await driver.wait(until.elementLocated(By.css('.settings-icon')), 5000);
    await driver.executeScript("arguments[0].click();", settingsIcon);
    console.log('Settings icon clicked');

    const settingsMenuItem = await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'menu-item')]//span[text()='Settings']")),
      5000
    );
    await driver.executeScript("arguments[0].click();", settingsMenuItem);
    console.log('🧩 Settings menu item clicked');

    await driver.wait(until.elementLocated(By.css('.settings-modal-overlay')), 5000);
    console.log('🪟 Settings modal opened');

    // Tabs to click
    const tabs = ['Appearance', 'Account', 'Notifications'];

    for (const tabName of tabs) {
      const tabButton = await driver.wait(
        until.elementLocated(By.xpath(`//button[contains(@class, 'settings-tab-button') and contains(text(), '${tabName}')]`)),
        5000
      );
      await driver.executeScript("arguments[0].click();", tabButton);
      console.log(`"${tabName}" tab clicked`);
      await driver.sleep(1000);
    }

    // Screenshot success
    fs.writeFileSync('settings_tabs_success.png', await driver.takeScreenshot(), 'base64');
    console.log('📸 Screenshot saved: settings_tabs_success.png');
    console.log('✅ TEST PASSED');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    fs.writeFileSync(`settings_tabs_failure_${Date.now()}.png`, await driver.takeScreenshot(), 'base64');
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runSettingsTabsTest();