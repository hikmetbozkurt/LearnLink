const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-010-Direct-Messaging
 * Test Priority: High
 * Module: Direct Messages
 * Description: Verify direct message sending and receiving functionality
 * Pre-requisites: 
 * - Users must be registered
 * - Test user must exist in the system
 */

// Create necessary directories for screenshots
const screenshotDir = path.join(__dirname, 'testcase10_ss');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

async function runDirectMessageTest() {
  // Create two browser instances for sender and receiver
  const senderDriver = await new Builder().forBrowser('chrome').build();
  const receiverDriver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting LearnLink Direct Message Test');
    const testUrl = 'http://localhost:3000/';
    const senderEmail = 'admin@admin.com';
    const receiverEmail = 'hamdi@hamdi.com';
    const senderPassword = 'Admin123';
    const receiverPassword = 'Hamdi123';
    const testMessage = 'hi test user!';

    // Step 1: Login both users
    console.log('Step 1: Logging in users...');
    // Login sender
    await senderDriver.get(testUrl);
    await senderDriver.sleep(2000);
    const senderSignIn = await senderDriver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await senderSignIn.findElement(By.css('input[type="email"]')).sendKeys(senderEmail);
    await senderSignIn.findElement(By.css('input[type="password"]')).sendKeys(senderPassword);
    await senderSignIn.findElement(By.css('button[type="submit"]')).click();
    await senderDriver.wait(until.urlContains('/home'), 10000);

    // Login receiver
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

    // Step 2: Navigate to Direct Messages page
    console.log('Step 2: Navigating to Direct Messages page...');
    await senderDriver.findElement(By.css('a[href="/direct-messages"]')).click();
    await receiverDriver.findElement(By.css('a[href="/direct-messages"]')).click();
    await senderDriver.sleep(3000);
    await receiverDriver.sleep(3000);

    // Step 3: Select user in both windows
    console.log('Step 3: Selecting users for direct message...');
    
    // Sender selects a chat
    const senderUserElement = await senderDriver.wait(
        until.elementLocated(By.css('.chat-room')),
        10000
    );
    const userName = await senderUserElement.findElement(By.css('h3')).getText();
    console.log('Sender found user:', userName);
    await senderUserElement.click();
    await senderDriver.sleep(2000);

    // Receiver selects the same chat
    console.log('Waiting for receiver to find matching chat...');
    const receiverUserElements = await receiverDriver.findElements(By.css('.chat-room'));
    let matchingChatFound = false;
    
    for (const element of receiverUserElements) {
        const currentName = await element.findElement(By.css('h3')).getText();
        if (currentName.includes('admin') || currentName.includes('Admin')) {
            console.log('Receiver found matching chat:', currentName);
            await element.click();
            matchingChatFound = true;
            break;
        }
    }

    if (!matchingChatFound) {
        throw new Error('Receiver could not find the matching chat');
    }

    await receiverDriver.sleep(2000);

    await senderDriver.takeScreenshot().then(data => {
        fs.writeFileSync(path.join(screenshotDir, '2_users_selected.png'), data, 'base64');
    });
    console.log('Step 3 PASS: Users selected successfully in both windows');

    // Step 4: Send direct message
    console.log('Step 4: Sending direct message...');
    try {
        // Wait for chat area to be visible
        await senderDriver.wait(
            until.elementLocated(By.css('.chat-area')),
            10000
        );
        
        // Wait for form to be visible and find input
        const form = await senderDriver.wait(
            until.elementLocated(By.css('.chat-area form')),
            10000
        );
        const messageInput = await form.findElement(By.css('input[type="text"]'));
        await messageInput.clear();
        await messageInput.sendKeys(testMessage);
        
        // Find and click send button within the form
        const sendButton = await form.findElement(By.css('.send-button'));
        await sendButton.click();
        
        await senderDriver.sleep(5000);
        
        await senderDriver.takeScreenshot().then(data => {
            fs.writeFileSync(path.join(screenshotDir, '3_message_sent.png'), data, 'base64');
        });
        console.log('Step 4 PASS: Direct message sent');
    } catch (error) {
        console.error('Error during message sending:', error);
        await senderDriver.takeScreenshot().then(data => {
            fs.writeFileSync(path.join(screenshotDir, '3_message_send_error.png'), data, 'base64');
        });
        throw error;
    }

    // Step 5: Verify message appears in both windows
    console.log('Step 5: Verifying message visibility...');
    
    // Wait longer for messages to appear
    await senderDriver.sleep(5000);
    
    try {
        // Get messages with more specific selector
        const senderMessages = await senderDriver.findElements(By.css('.message-content'));
        const receiverMessages = await receiverDriver.findElements(By.css('.message-content'));
        
        console.log('Found sender messages:', senderMessages.length);
        console.log('Found receiver messages:', receiverMessages.length);
        
        if (senderMessages.length === 0 || receiverMessages.length === 0) {
            throw new Error('No messages found in one or both windows');
        }
        
        // Get the last message from both users
        const lastSenderMessage = await senderMessages[senderMessages.length - 1].getText();
        const lastReceiverMessage = await receiverMessages[receiverMessages.length - 1].getText();
        
        console.log('Last sender message:', lastSenderMessage);
        console.log('Last receiver message:', lastReceiverMessage);
        
        if (lastSenderMessage.includes(testMessage) && lastReceiverMessage.includes(testMessage)) {
            console.log('Step 5 PASS: Message visible in both windows');
            console.log('TEST PASSED: Direct messaging functionality working correctly');
        } else {
            throw new Error(`Direct message content does not match. Expected: ${testMessage}, Sender: ${lastSenderMessage}, Receiver: ${lastReceiverMessage}`);
        }
    } catch (error) {
        console.error('Error during message verification:', error);
        
        // Take screenshots of both windows for debugging
        await senderDriver.takeScreenshot().then(data => {
            fs.writeFileSync(path.join(screenshotDir, '4_sender_verification_error.png'), data, 'base64');
        });
        await receiverDriver.takeScreenshot().then(data => {
            fs.writeFileSync(path.join(screenshotDir, '4_receiver_verification_error.png'), data, 'base64');
        });
        
        throw error;
    }

    await receiverDriver.takeScreenshot().then(data => {
        fs.writeFileSync(path.join(screenshotDir, '4_message_received.png'), data, 'base64');
    });

  } catch (error) {
    console.error('DIRECT MESSAGE TEST FAILED:', error.message);
    try {
      const screenshot = await senderDriver.takeScreenshot();
      fs.writeFileSync(path.join(screenshotDir, `dm_sender_error_${Date.now()}.png`), screenshot, 'base64');
      const receiverScreenshot = await receiverDriver.takeScreenshot();
      fs.writeFileSync(path.join(screenshotDir, `dm_receiver_error_${Date.now()}.png`), receiverScreenshot, 'base64');
    } catch (screenshotError) {
      console.error('Failed to save error screenshot:', screenshotError.message);
    }
    throw error;
  } finally {
    await senderDriver.quit();
    await receiverDriver.quit();
  }
}

runDirectMessageTest().catch(e => {
  console.error('Direct message test execution failed:', e.message);
  process.exit(1);
});