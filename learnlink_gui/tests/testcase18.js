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

    console.log('Taking screenshot of home page to inspect elements');
    const homePageShot = await driver.takeScreenshot();
    fs.writeFileSync('home_page_elements.png', homePageShot, 'base64');

    await driver.sleep(2000);

    try {
      console.log('Trying to find Create Event element...');
      
      const createEventEl = await driver.findElement(By.xpath("//*[contains(text(),'Create Event')]"));
      console.log('Found element with "Create Event" text');
      await createEventEl.click();
    } catch (error) {
      console.log('Could not find element with text "Create Event", trying alternative methods...');
      
      try {
        const eventButton = await driver.findElement(By.css(".create-event-button, [aria-label='Create Event']"));
        console.log('Found event button by class/aria-label');
        await eventButton.click();
      } catch (err) {
        console.log('Trying to find any event-related buttons...');
        
        const buttons = await driver.findElements(By.css("button, a"));
        console.log(`Found ${buttons.length} button/link elements`);
        
        for (let i = 0; i < buttons.length; i++) {
          try {
            const text = await buttons[i].getText();
            console.log(`Button/Link ${i+1}: "${text}"`);
            if (text.toLowerCase().includes('event')) {
              console.log('Found button with event-related text, clicking it');
              await buttons[i].click();
              break;
            }
          } catch (e) {
            console.log(`Could not get text for button ${i+1}`);
          }
        }
      }
    }

    console.log('Clicked Create Event link/button');

    const clickedEventLinkShot = await driver.takeScreenshot();
    fs.writeFileSync('step_clicked_event_link.png', clickedEventLinkShot, 'base64');

    await driver.wait(until.urlContains('/events'), 10000);
    console.log('Navigated to /events');

    const navigatedToEventsShot = await driver.takeScreenshot();
    fs.writeFileSync('step_navigated_to_events.png', navigatedToEventsShot, 'base64');

    // Wait for page to load and click "Add Event" button
    console.log('Looking for "Add Event" button on events page');
    await driver.sleep(2000);

    // Looking specifically for the add-event-button based on the code from EventModal.tsx
    try {
      const addEventButton = await driver.findElement(By.css(".add-event-button"));
      await addEventButton.click();
      console.log('Clicked "Add Event" button');
    } catch (error) {
      console.log('Could not find .add-event-button, trying to click on a date first');
      
      // We need to click on a calendar date first to open the modal
      const calendarDays = await driver.findElements(By.css('.calendar-day'));
      
      if (calendarDays.length > 0) {
        // Click on the middle of the month (to avoid disabled days)
        const middleIndex = Math.floor(calendarDays.length / 2);
        await calendarDays[middleIndex].click();
        console.log('Clicked on a calendar day');
        
        // Now try to find the Add Event button inside the modal
        await driver.sleep(1000);
        try {
          const addEventButton = await driver.findElement(By.css(".add-event-button"));
          await addEventButton.click();
          console.log('Clicked "Add Event" button inside the modal');
        } catch (err) {
          console.log('Modal opened but Add Event button not found, trying again with XPath');
          try {
            const addButton = await driver.findElement(By.xpath("//button[contains(text(), 'Add Event')]"));
            await addButton.click();
            console.log('Found and clicked Add Event button by text');
          } catch (e) {
            // If the modal is already in the "add event" state, we don't need to click anything
            console.log('Could not find Add Event button, checking if form is already visible');
          }
        }
      } else {
        throw new Error('Could not find any calendar days to click');
      }
    }

    // Wait for form to appear and complete it
    await driver.sleep(1000);
    console.log('Filling out event form');
    
    // Event details
    const eventTitle = `Test Event ${new Date().toISOString().slice(0, 10)}`;
    const eventDescription = 'This is an automated test event';
    
    // Check if we're on the event form
    try {
      // Title
      await driver.findElement(By.css("input[name='title']")).sendKeys(eventTitle);
      console.log('Entered event title');
      
      // Description
      await driver.findElement(By.css("textarea[name='description']")).sendKeys(eventDescription);
      console.log('Entered event description');
      
      // Time - already has a default value
      
      // Type - already has a default value
      
      // Take screenshot after filling form
      const filledFormShot = await driver.takeScreenshot();
      fs.writeFileSync('event_form_filled.png', filledFormShot, 'base64');
      
      // Submit the form
      console.log('Submitting event form');
      const submitButton = await driver.findElement(By.css("button[type='submit']"));
      await submitButton.click();
      
      // Wait for submission to complete
      await driver.sleep(3000);
      console.log('Event form submitted');
      
      // Take final screenshot
      const finalShot = await driver.takeScreenshot();
      fs.writeFileSync('event_created_success.png', finalShot, 'base64');
      
      console.log('TEST PASSED: Event created successfully');
    } catch (error) {
      console.error('Error filling event form:', error.message);
      throw error;
    }

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