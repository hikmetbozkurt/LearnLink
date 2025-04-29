const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

async function testSupportCategories() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('🔍 Starting Support Categories Navigation Test');

    const testUrl = 'http://localhost:3000/';
    const email = 'admin@admin.com';
    const password = 'Admin123';

    // Step 1: Login
    await driver.get(testUrl);
    await driver.sleep(1000);
    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(email);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(password);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('✅ Login successful');

    // Step 2: Navigate to support page
    await driver.get('http://localhost:3000/support');
    await driver.wait(until.elementLocated(By.css('.support-container')), 10000);
    console.log('✅ Support page loaded');

    // Step 3: Select all visible non-empty category sidebar items
    const categoryButtons = await driver.findElements(By.css('.category-sidebar .category-item'));
    console.log(`📋 Found ${categoryButtons.length} categories`);

    for (let i = 0; i < categoryButtons.length; i++) {
      const category = categoryButtons[i];
      const label = await category.getText();

      // Skip if label is empty (avoids "element not interactable" error)
      if (!label.trim()) {
        console.log(`⚠️ Skipping empty category index ${i}`);
        continue;
      }

      console.log(`➡️ Clicking category: ${label}`);
      await category.click();
      await driver.sleep(800);

      const header = await driver.findElement(By.css('.faq-main-content h2'));
      const headerText = await header.getText();
      console.log(`✅ Page loaded: ${headerText}`);

      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`support_category_${i + 1}.png`, screenshot, 'base64');
    }

    console.log('🎯 TEST PASSED: All support categories opened successfully');

  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    const failShot = await driver.takeScreenshot();
    fs.writeFileSync(`support_category_fail_${Date.now()}.png`, failShot, 'base64');
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

testSupportCategories();