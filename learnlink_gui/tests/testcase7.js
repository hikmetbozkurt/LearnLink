const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

async function runSendReceiveMessageTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('🔧 Starting Test Case 7: Send & Receive Message');

    const testUrl = 'http://localhost:3000/';
    const email = 'admin@admin.com';
    const password = 'Admin123';
    const messageText = 'Hello LearnLink!';

    await driver.get(testUrl);
    await driver.sleep(2000);

    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(email);

    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(password);

    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();

    await driver.wait(until.elementLocated(By.css('.chat-container, .sidebar')), 10000);
    console.log('✅ Logged in successfully');

    const homeScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_logged_in_dashboard.png', homeScreenshot, 'base64');

    await driver.get('http://localhost:3000/direct-messages');
    await driver.wait(until.elementLocated(By.css('.chat-container')), 10000);
    console.log('📨 Direct messages page loaded');

    const dmScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_direct_messages_page.png', dmScreenshot, 'base64');

    const conversationList = await driver.findElements(By.css('.chat-sidebar .room-item'));
    if (conversationList.length === 0) {
      throw new Error('No conversations found.');
    }
    await conversationList[0].click();

    await driver.sleep(1000);
    await driver.wait(until.elementLocated(By.css('.chat-area textarea')), 5000);

    const textarea = await driver.findElement(By.css('.chat-area textarea'));
    await textarea.sendKeys(messageText);

    const sendButton = await driver.findElement(By.css('.chat-area button[type="submit"], .chat-area .send-button'));
    await sendButton.click();

    console.log('✅ Message sent');

    await driver.sleep(3000);

    const messageElements = await driver.findElements(By.xpath(`//*[contains(text(), "Hello LearnLink!")]`));
    if (messageElements.length > 0) {
      console.log('✅ Message appears in chat');
    } else {
      throw new Error('Message not found in chat');
    }

    const finalScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('3_message_sent_confirmation.png', finalScreenshot, 'base64');

    console.log('✅ Test Passed: Send & Receive Message');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    try {
      const failShot = await driver.takeScreenshot();
      fs.writeFileSync(`error_screenshot_${Date.now()}.png`, failShot, 'base64');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot on error');
    }
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runSendReceiveMessageTest();