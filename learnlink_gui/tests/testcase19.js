const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-019-View and Manage Events
 * Test Priority: Medium
 * Description: User creates and edits an event
 */
async function runViewAndManageEventTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  // Helper: Save screenshot to testcase19_ss folder
  async function saveStepScreenshot(filename) {
    const folder = path.join(__dirname, 'testcase19_ss');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    const shot = await driver.takeScreenshot();
    fs.writeFileSync(path.join(folder, filename), shot, 'base64');
  }

  try {
    console.log('Test Case 19: View and Manage Events');

    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';

    // Step 1: Login
    await driver.get(testUrl);
    await driver.sleep(2000);
    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(testEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    await saveStepScreenshot('01_logged_in.png');

    // Step 2: Go to Events page from sidebar
    await driver.findElement(By.css('a[href="/events"]')).click();
    await driver.wait(until.urlContains('/events'), 10000);
    await driver.sleep(2000);
    await saveStepScreenshot('02_events_page.png');

    // Step 3: Click the calendar day for May 7, 2025
    let may7Day = null;
    const days = await driver.findElements(By.css('.calendar-day'));
    for (const day of days) {
      const text = (await day.getText()).trim();
      // Match if the text starts with '7' (may have event name below)
      if (text.startsWith('7')) {
        may7Day = day;
        break;
      }
    }
    if (!may7Day) throw new Error('Could not find calendar day for May 7, 2025');
    await may7Day.click();
    await driver.sleep(1000);
    await saveStepScreenshot('03_calendar_day_clicked.png');

    // Step 4: Modal açılmasını bekle
    await driver.wait(until.elementLocated(By.css('.event-modal')), 10000);

    // Step 5: Wait for event items to appear, then find "Demo Day"
    await driver.wait(until.elementLocated(By.css('.event-item')), 10000);
    const eventItems = await driver.findElements(By.css('.event-item'));
    let foundEvent = null;
    for (const item of eventItems) {
      try {
        const titleElem = await item.findElement(By.css('h3'));
        const titleText = (await titleElem.getText()).trim();
        if (titleText === "Demo Day") {
          foundEvent = item;
          break;
        }
      } catch {}
    }
    if (!foundEvent) throw new Error('Could not find event with title "Demo Day"');
    await foundEvent.findElement(By.css('.edit-event-button')).click();
    await driver.sleep(1000);
    await saveStepScreenshot('04_edit_event_modal_opened.png');

    // Step 6: Description alanını güncelle
    const descInput = await driver.findElement(By.css('.add-event-form textarea[name="description"]'));
    await descInput.clear();
    await descInput.sendKeys('test success');
    await saveStepScreenshot('05_description_updated.png');

    // Step 7: Update Event (submit)
    const updateButton = await driver.findElement(By.css('.add-event-form .submit-button'));
    await updateButton.click();
    await driver.wait(until.stalenessOf(updateButton), 10000);
    await saveStepScreenshot('06_event_updated.png');

    // Step 8: Modal kapanınca tekrar açıp güncellenmiş description'ı doğrula (opsiyonel)
    await may7Day.click();
    await driver.wait(until.elementLocated(By.css('.event-modal')), 10000);

    // Wait for the updated event description to appear
    try {
      const updatedEventDesc = await driver.wait(
        until.elementLocated(By.xpath(`//div[contains(@class,"event-item")]//h3[normalize-space(text())="Demo Day"]/following-sibling::p[contains(@class,"event-description") and contains(normalize-space(.),"test success")]`)),
        10000
      );
      if (updatedEventDesc) {
        console.log('TEST PASSED: Event description updated and visible.');
        await saveStepScreenshot('07_event_update_verified.png');
      }
    } catch {
      throw new Error('Updated event description not found!');
    }

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    await saveStepScreenshot('99_event_test_failure.png');
  } finally {
    await driver.quit();
    console.log('Browser closed');
  }
}

runViewAndManageEventTest();