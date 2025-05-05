const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * LL-TC-021 - View Assignments (Student)
 */
async function runViewAssignmentsTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting Test: View Assignments (Student)');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'hamdi@hamdi.com';
    const testPassword = 'Hamdi123';

    // Login
    await driver.get(testUrl);
    await driver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log(' Logged in successfully');

    // Go directly to assignments page after login
    await driver.get('http://localhost:3000/assignments');
    await driver.wait(until.urlContains('/assignments'), 10000);
    // Wait for assignments page to load
    await driver.wait(until.elementLocated(By.css('.assignments-page')), 10000);
    console.log('Assignments page loaded');

    // Go to assignments tab/page
    // Try to find a nav/tab/button with assignments
    let assignmentsTab;
    try {
      assignmentsTab = await driver.wait(
        until.elementLocated(By.xpath("//a[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'assignments')] | //button[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'assignments')]")),
        5000
      );
    } catch {
      // Try fallback selector if needed
      assignmentsTab = await driver.wait(
        until.elementLocated(By.css('[href*="assignments"], .assignments-tab, .assignments-link')),
        5000
      );
    }
    await assignmentsTab.click();
    console.log('Assignments tab clicked');

    // Wait for assignments list to load
    await driver.wait(until.elementLocated(By.css('.assignments-list, .assignment-list, .assignment-card')), 10000);
    console.log('Assignments list loaded');

    const assignmentName = 'TEST ASSIGNMENT';
    const assignmentItem = await driver.wait(
      until.elementLocated(By.xpath(`//*[contains(@class,'assignment') and contains(text(),'${assignmentName}')] | //*[contains(text(),'${assignmentName}')]`)),
      10000
    );
    await assignmentItem.click();
    console.log(`Assignment '${assignmentName}' clicked`);

    // Screenshot success
    fs.writeFileSync('assignment_click_success.png', await driver.takeScreenshot(), 'base64');
    console.log('Screenshot saved: assignment_click_success.png');
    console.log('TEST PASSED');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    fs.writeFileSync(`assignment_click_failure_${Date.now()}.png`, await driver.takeScreenshot(), 'base64');
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runViewAssignmentsTest();
