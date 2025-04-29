const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

async function runReceiveNotificationTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting Test Case 8: Receive Notifications');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';

    // Navigate to login page
    await driver.get(testUrl);
    await driver.sleep(1000);

    // Enter credentials
    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.sendKeys(testEmail);

    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.sendKeys(testPassword);

    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();

    // Wait for dashboard
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Logged in successfully');

    // Wait for notification bell
    const bell = await driver.wait(until.elementLocated(By.css('.notification-bell')), 10000);
    console.log('Notification bell located');

    // Click the bell to show dropdown
    await driver.sleep(2000);
    await bell.click();
    console.log('Notification bell clicked');

    // Wait for dropdown panel
    await driver.wait(until.elementLocated(By.css('.notification-dropdown')), 10000);
    console.log('Notification dropdown is visible');

    // Wait for notification list to load (if any)
    const items = await driver.findElements(By.css('.notification-item'));
    console.log(`Total notifications displayed: ${items.length}`);

    // Screenshot
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync('notification_dropdown_shown.png', screenshot, 'base64');

    console.log('TEST PASSED: Notification dropdown opened and visible');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync(`notification_test_error_${Date.now()}.png`, screenshot, 'base64');
  } finally {
    await driver.quit();
  }
}

runReceiveNotificationTest();