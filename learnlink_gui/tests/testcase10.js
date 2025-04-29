const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-010-Schedule Meeting
 * Test Priority: Medium
 * Module: Calendar/Chat
 * Description: Users should be able to schedule meetings from calendar
 */
async function runScheduleMeetingTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Schedule Meeting Test (LL-TC-010)');
    
    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';
    
    // Step 1: Login first
    console.log('Step 1: Logging in...');
    await driver.get(testUrl);
    await driver.sleep(3000);

    const signInContainer = await driver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    const emailInput = await signInContainer.findElement(By.css('input[type="email"]'));
    const passwordInput = await signInContainer.findElement(By.css('input[type="password"]'));
    
    await emailInput.sendKeys(testEmail);
    await passwordInput.sendKeys(testPassword);
    
    const loginButton = await signInContainer.findElement(By.css('button[type="submit"]'));
    await loginButton.click();
    
    await driver.wait(until.urlContains('/home'), 10000);
    await driver.sleep(3000);
    
    const loginScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('testcase10_ss/1_logged_in.png', loginScreenshot, 'base64');
    console.log('Step 1 PASS: Successfully logged in');
    
    // Step 2: Navigate to Calendar page
    console.log('Step 2: Navigating to calendar...');
    await driver.get('http://localhost:3000/events');
    await driver.wait(until.elementLocated(By.css('.events-page')), 10000);
    await driver.sleep(2000);
    
    const calendarScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('testcase10_ss/2_calendar_page.png', calendarScreenshot, 'base64');
    console.log('Step 2 PASS: Successfully navigated to calendar');

    // Step 3: Click on January 12th
    console.log('Step 3: Selecting date...');
    // Find the day by its number
    const dayCell = await driver.findElement(By.xpath("//div[contains(@class, 'calendar-day')]//span[text()='12']"));
    await dayCell.click();
    
    // Wait for event modal and input[name='title'] to appear
    await driver.wait(until.elementLocated(By.css('.event-modal')), 5000);
    // Önce Add Event butonuna tıkla
    const addEventBtn = await driver.findElement(By.css('.add-event-button'));
    await addEventBtn.click();
    // Şimdi formun gelmesini bekle
    await driver.wait(until.elementLocated(By.css('input#title')), 5000);
    const eventModalScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('testcase10_ss/3_event_modal.png', eventModalScreenshot, 'base64');
    console.log('Step 3 PASS: Date selected and modal opened');

    // Step 4: Fill in meeting details
    console.log('Step 4: Setting meeting details...');
    const titleInput = await driver.findElement(By.css('input#title'));
    await titleInput.sendKeys('Team Meeting');
    
    const descInput = await driver.findElement(By.css('#description'));
    await descInput.sendKeys('Team sync-up meeting');
    
    const timeInput = await driver.findElement(By.css('#time'));
    await timeInput.clear();
    await timeInput.sendKeys('15:00');
    
    const typeSelect = await driver.findElement(By.css('#type'));
    await typeSelect.sendKeys('meeting');
    
    const filledFormScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('testcase10_ss/4_filled_form.png', filledFormScreenshot, 'base64');
    
    const createEventButton = await driver.findElement(By.css('.submit-button'));
    await createEventButton.click();
    
    await driver.wait(until.stalenessOf(await driver.findElement(By.css('.event-modal'))), 5000);
    
    const finalScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('testcase10_ss/5_meeting_created.png', finalScreenshot, 'base64');
    console.log('Step 4 PASS: Meeting scheduled successfully');
    
    console.log('TEST PASSED: Meeting scheduled successfully');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`testcase10_ss/failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runScheduleMeetingTest().catch(error => {
  console.error('Test execution failed:', error.message);
}); 