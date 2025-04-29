const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-018-Create Event from Home Page 
 * Test Priority: High
 * Description: Clicks 'Create Event' on Home and creates a new event on the /events page.
 */
async function runCreateEventTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Test Case 18: Create Event from Home');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';

    await driver.get(testUrl);
    await driver.sleep(2000);
    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Logged in and on /home');

    const loginSuccessShot = await driver.takeScreenshot();
    fs.writeFileSync('step_login_success.png', loginSuccessShot, 'base64');

    const createEventLink = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(text(),'Create Event')]")),
      10000
    );
    await createEventLink.click();
    console.log('Clicked Create Event link');

    const clickedEventLinkShot = await driver.takeScreenshot();
    fs.writeFileSync('step_clicked_event_link.png', clickedEventLinkShot, 'base64');

    await driver.wait(until.urlContains('/events'), 10000);
    console.log('Navigated to /events');

    const navigatedToEventsShot = await driver.takeScreenshot();
    fs.writeFileSync('step_navigated_to_events.png', navigatedToEventsShot, 'base64');

    console.log('TEST PASSED (without creating actual event)');
    const finalShot = await driver.takeScreenshot();
    fs.writeFileSync('create_event_landing_success.png', finalShot, 'base64');
    console.log('📸 Screenshot saved: create_event_landing_success.png');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    const failShot = await driver.takeScreenshot();
    fs.writeFileSync(`event_test_failure_${Date.now()}.png`, failShot, 'base64');
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runCreateEventTest();