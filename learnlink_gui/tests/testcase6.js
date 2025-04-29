const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-006-CreateChatroom
 * Test Priority: High
 * Module: Authentication
 * Description: Verify user can create chatroom
 */

async function testCreateChatroom() {
  const driver = await new Builder().forBrowser('chrome').build();

  const appUrl = 'http://localhost:3000/';
  const userEmail = 'admin@admin.com';
  const userPassword = 'Admin123';
  const chatroomName = 'Project Group';

  try {
    console.log('Test Start: Create Chatroom');

    console.log('Logging in...');
    await driver.get(appUrl);
    await driver.sleep(2000);

    await driver.findElement(By.css('.sign-in input[type="email"]')).sendKeys(userEmail);
    await driver.findElement(By.css('.sign-in input[type="password"]')).sendKeys(userPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Login successful');

    const loginScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_logged_in.png', loginScreenshot, 'base64');

    // Navigate to Chatrooms
    console.log('Navigating to /chatrooms...');
    await driver.get('http://localhost:3000/chatrooms');
    await driver.wait(until.elementLocated(By.css('.chat-page')), 10000);
    console.log('Chat page loaded');

    const chatPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_chatroom_page.png', chatPageScreenshot, 'base64');

    // Click Create Chatroom button
    console.log('Clicking "Create Room" button...');
    const createButton = await driver.findElement(By.css('.create-room-button'));
    await createButton.click();
    await driver.wait(until.elementLocated(By.css('.create-room-modal')), 5000);
    console.log('Modal opened');

    const modalOpenScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('3_modal_opened.png', modalOpenScreenshot, 'base64');

    // Enter Chatroom Name
    console.log(`Entering room name: ${chatroomName}`);
    const input = await driver.findElement(By.css('input[name="roomName"]'));
    await input.sendKeys(chatroomName);

    const inputScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('4_room_name_entered.png', inputScreenshot, 'base64');

    // Submit form
    console.log('Creating chatroom...');
    const submitBtn = await driver.findElement(By.css('.create-button'));
    await submitBtn.click();

    // Wait for room to appear in sidebar
    console.log('Waiting for room to appear...');
    await driver.wait(until.elementLocated(By.xpath(`//div[contains(@class, 'chat-room')]//h3[text()='${chatroomName}']`)), 10000);
    console.log('Chatroom successfully created and visible');

    const finalScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('5_chatroom_created.png', finalScreenshot, 'base64');

    console.log('TEST PASSED');

  } catch (error) {
    console.error('TEST FAILED:', error.message);

    try {
      const failShot = await driver.takeScreenshot();
      fs.writeFileSync(`error_screenshot_${Date.now()}.png`, failShot, 'base64');
      console.log('Error screenshot saved');
    } catch (screenshotError) {
      console.error('Could not capture screenshot:', screenshotError.message);
    }

  } finally {
    await driver.quit();
    console.log('Browser closed');
  }
}

testCreateChatroom();