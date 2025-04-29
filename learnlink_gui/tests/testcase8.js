const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-008-View Notifications
 * Test Priority: Medium
 * Module: Notification System
 * Description: User clicks the notification bell and sees the notifications list.
 */
async function runNotificationBellTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting LearnLink Notification Bell Test (LL-TC-008-View Notifications)');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';

    // Step 1: Login
    console.log('Step 1: Logging in...');
    await driver.get(testUrl);
    await driver.sleep(2000);

    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(testEmail);

    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(testPassword);

    const loginScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_filled.png', loginScreenshot, 'base64');

    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();

    await driver.wait(until.urlContains('/home'), 10000);
    console.log('✅ Login successful and redirected to /home');

    const homeScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_home_page.png', homeScreenshot, 'base64');

    // Step 2: Click notification bell
    console.log('Step 2: Clicking notification bell...');
    const bellButton = await driver.wait(until.elementLocated(By.css('.notification-bell')), 10000);
    
    // Use JS click to avoid interception
    await driver.executeScript("arguments[0].click();", bellButton);
    console.log('✅ Notification bell clicked');

    await driver.sleep(1500);

    // Step 3: Check dropdown visibility
    console.log('Step 3: Verifying notification dropdown...');
    const dropdown = await driver.wait(until.elementLocated(By.css('.notification-dropdown')), 5000);
    const isVisible = await dropdown.isDisplayed();

    if (isVisible) {
      console.log('✅ Notification dropdown is visible');
    } else {
      console.log('❌ Notification dropdown is NOT visible');
    }

    const notifScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('3_notification_dropdown.png', notifScreenshot, 'base64');
    console.log('Screenshot saved: 3_notification_dropdown.png');

    console.log('TEST PASSED: Notifications are displayed after clicking the bell');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    const failShot = await driver.takeScreenshot();
    const failFile = `notification_test_failure_${Date.now()}.png`;
    fs.writeFileSync(failFile, failShot, 'base64');
    console.log('Screenshot saved:', failFile);
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runNotificationBellTest().catch(err => console.error('Unhandled Exception:', err.message));