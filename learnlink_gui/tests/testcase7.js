const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-007-Chatroom-Messaging
 * Test Priority: High
 * Module: Chatrooms
 * Description: Verify message sending and receiving functionality in a chatroom between admin and test user
 * Pre-requisites: 
 * - Users must be registered (admin@admin.com and test@test.com)
 * - At least one chatroom must exist
 * - Both users must have access to the same chatroom
 */

// Create necessary directories for screenshots
const screenshotDir = path.join(__dirname, 'testcase7_ss');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runChatroomMessageTest() {
  // Create two browser instances for sender and receiver
  const senderDriver = await new Builder().forBrowser('chrome').build();
  const receiverDriver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting LearnLink Chatroom Messaging Test');
    const testUrl = 'http://localhost:3000/';
    const senderEmail = 'admin@admin.com';
    const senderPassword = 'Admin123';
    const receiverEmail = 'hamdi@hamdi.com';
    const receiverPassword = 'Hamdi123';
    const testMessage = 'Hello from chatroom test!';

    // Step 1: Login both users
    console.log('Step 1: Logging in users to access chatroom...');
    // Login sender (admin)
    await senderDriver.get(testUrl);
    await senderDriver.sleep(2000);
    const senderSignIn = await senderDriver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await senderSignIn.findElement(By.css('input[type="email"]')).sendKeys(senderEmail);
    await senderSignIn.findElement(By.css('input[type="password"]')).sendKeys(senderPassword);
    await senderSignIn.findElement(By.css('button[type="submit"]')).click();
    await senderDriver.wait(until.urlContains('/home'), 10000);

    // Login receiver (test user)
    await receiverDriver.get(testUrl);
    await receiverDriver.sleep(2000);
    const receiverSignIn = await receiverDriver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await receiverSignIn.findElement(By.css('input[type="email"]')).sendKeys(receiverEmail);
    await receiverSignIn.findElement(By.css('input[type="password"]')).sendKeys(receiverPassword);
    await receiverSignIn.findElement(By.css('button[type="submit"]')).click();
    await receiverDriver.wait(until.urlContains('/home'), 10000);

    await senderDriver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '1_users_logged_in.png'), data, 'base64');
    });
    console.log('Step 1 PASS: Both users successfully logged in');

    // Step 2: Navigate to Chatrooms page
    console.log('Step 2: Navigating to Chatrooms page...');
    await senderDriver.findElement(By.css('a[href="/chatrooms"]')).click();
    await receiverDriver.findElement(By.css('a[href="/chatrooms"]')).click();
    await senderDriver.sleep(2000);
    await receiverDriver.sleep(2000);

    // Step 3: Enter chatroom
    console.log('Step 3: Entering test chatroom...');
    const senderChatRoom = await senderDriver.wait(until.elementLocated(By.css('.chat-room')), 10000);
    const receiverChatRoom = await receiverDriver.wait(until.elementLocated(By.css('.chat-room')), 10000);
    
    await senderChatRoom.click();
    await receiverChatRoom.click();
    await senderDriver.sleep(2000);
    
    await senderDriver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '2_chatroom_entered.png'), data, 'base64');
    });
    console.log('Step 3 PASS: Both users entered chatroom successfully');

    // Step 4: Send message in chatroom
    console.log('Step 4: Sending message in chatroom...');
    const messageInput = await senderDriver.wait(
      until.elementLocated(By.css('input[placeholder="Type a message..."]')),
      10000
    );
    await senderDriver.wait(until.elementIsVisible(messageInput), 5000);
    await messageInput.sendKeys(testMessage);
    
    // Hide live chat widget if present (for both sender and receiver)
    await senderDriver.executeScript(`
      var chat = document.getElementById('live-chat-ai-host');
      if (chat) { chat.style.display = 'none'; }
    `);
    await receiverDriver.executeScript(`
      var chat = document.getElementById('live-chat-ai-host');
      if (chat) { chat.style.display = 'none'; }
    `);

    // Click send button in chatroom
    const sendButton = await senderDriver.findElement(By.css('.send-button'));
    await sendButton.click();
    // Increase wait time for message to be sent and received
    await senderDriver.sleep(5000);

    await senderDriver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '3_chatroom_message_sent.png'), data, 'base64');
    });
    console.log('Step 4 PASS: Message sent in chatroom');

    // Step 5: Verify message appears in both chatroom windows
    console.log('Step 5: Verifying message visibility in chatroom...');
    
    // Wait for messages to appear and get all messages
    await senderDriver.sleep(2000);
    const senderMessages = await senderDriver.findElements(By.css('.message-text'));
    const receiverMessages = await receiverDriver.findElements(By.css('.message-text'));
    
    // Get the last message from both users
    const lastSenderMessage = await senderMessages[senderMessages.length - 1].getText();
    const lastReceiverMessage = await receiverMessages[receiverMessages.length - 1].getText();
    
    console.log('Sender message:', lastSenderMessage);
    console.log('Receiver message:', lastReceiverMessage);
    
    if (lastSenderMessage === testMessage && lastReceiverMessage === testMessage) {
      console.log('Step 5 PASS: Message visible in both chatroom windows');
      console.log('TEST PASSED: Chatroom messaging functionality working correctly');
    } else {
      throw new Error(`Chatroom message content does not match. Expected: ${testMessage}, Sender: ${lastSenderMessage}, Receiver: ${lastReceiverMessage}`);
    }

    await receiverDriver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '4_chatroom_message_received.png'), data, 'base64');
    });

  } catch (error) {
    console.error('CHATROOM TEST FAILED:', error.message);
    try {
      const screenshot = await senderDriver.takeScreenshot();
      fs.writeFileSync(path.join(screenshotDir, `chatroom_sender_error_${Date.now()}.png`), screenshot, 'base64');
      const receiverScreenshot = await receiverDriver.takeScreenshot();
      fs.writeFileSync(path.join(screenshotDir, `chatroom_receiver_error_${Date.now()}.png`), receiverScreenshot, 'base64');
    } catch (screenshotError) {
      console.error('Failed to save chatroom error screenshot:', screenshotError.message);
    }
    throw error;
  } finally {
    await senderDriver.quit();
    await receiverDriver.quit();
  }
}

runChatroomMessageTest().catch(e => {
  console.error('Chatroom test execution failed:', e.message);
  process.exit(1);
});