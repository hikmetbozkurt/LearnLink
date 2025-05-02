const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

async function runEnableNotificationSettingsTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('🔧 Starting Test: Enable Notification Settings');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'test@test.com';
    const testPassword = 'Test1234';

    await driver.get(testUrl);
    await driver.sleep(2000);

    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('✅ Logged in');

    // Dismiss toast if exists
    try {
      const toast = await driver.findElement(By.css('.toast.success'));
      await driver.executeScript("arguments[0].remove();", toast);
      console.log('ℹ️ Toast dismissed');
    } catch {}

    // Click settings gear icon
    const settingsIcon = await driver.wait(until.elementLocated(By.css('.settings-icon')), 5000);
    await settingsIcon.click();
    console.log('⚙️ Settings icon clicked');

    // Wait for modal to appear (use any reliably rendered element)
    await driver.sleep(1000); // buffer
    await driver.wait(until.elementLocated(By.css('.settings-modal')), 7000);
    console.log('✅ Settings modal opened');

    // Switch to Notifications tab
    const notifTab = await driver.findElement(By.xpath("//button[contains(text(), 'Notifications')]"));
    await notifTab.click();
    await driver.sleep(500);
    console.log('🔔 Notifications tab opened');

    // Enable all checkboxes
    const toggles = await driver.findElements(By.css(".settings-switch input[type='checkbox']"));
    for (const toggle of toggles) {
      const isChecked = await toggle.isSelected();
      if (!isChecked) await toggle.click();
    }
    console.log('✅ All toggles turned ON');

    const saveBtn = await driver.findElement(By.xpath("//button[contains(text(), 'Save Changes')]"));
    await saveBtn.click();
    console.log('💾 Changes saved');

    const shot = await driver.takeScreenshot();
    fs.writeFileSync('testcase20_success.png', shot, 'base64');
    console.log('📸 Screenshot saved: testcase20_success.png');
    console.log('✅ TEST PASSED');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    const failShot = await driver.takeScreenshot();
    fs.writeFileSync(`testcase20_failed_${Date.now()}.png`, failShot, 'base64');
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runEnableNotificationSettingsTest();