const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-002-Register
 * Test Priority: High
 * Module: Authentication
 * Description: Ensure register functionality works properly
 */
async function runRegisterTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Register Test (LL-TC-002-Register)');
    
    const testUrl = 'http://localhost:3000/';  
    const testName = 'Test User5';
    const testEmail = 'testemail5@gmail.com';
    const testPassword = 'Testemail2.';
    
    console.log('Step 1: Opening register page...');
    await driver.get(testUrl);
    
    const registerPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_register_page.png', registerPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_register_page.png');
    
    await driver.sleep(2000);
    
    try {
      await driver.wait(until.elementLocated(By.css('.container')), 5000);
      console.log('Login page loaded, switching to registration view');
      
      const joinButton = await driver.findElement(By.css('.toggle-right .hidden'));
      await joinButton.click();
      
      await driver.wait(until.elementLocated(By.css('.container.active')), 5000);
      console.log('Step 1 PASS: Registration form appears');
      
      console.log('Step 2: Entering registration information...');
      
      const nameInput = await driver.findElement(By.css('.sign-up input[placeholder="Name"]'));
      await nameInput.clear();
      await nameInput.sendKeys(testName);
      console.log(`Step 2.1: Name '${testName}' is entered`);
      
      const emailInput = await driver.findElement(By.css('.sign-up input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys(testEmail);
      console.log(`Step 2.2: Email '${testEmail}' is entered`);
      
      const passwordInput = await driver.findElement(By.css('.sign-up input[placeholder="Password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys(testPassword);
      console.log(`Step 2.3: Password is entered`);
      
      const confirmPasswordInput = await driver.findElement(By.css('.sign-up input[placeholder="Confirm Password"]'));
      await confirmPasswordInput.clear();
      await confirmPasswordInput.sendKeys(testPassword);
      console.log(`Step 2.4: Confirm password is entered`);
      
      const infoEnteredScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_registration_info_entered.png', infoEnteredScreenshot, 'base64');
      console.log('Screenshot saved: 2_registration_info_entered.png');
      
      console.log('Step 3: Clicking register button...');
      const registerButton = await driver.findElement(By.css('.sign-up button[type="submit"]'));
      await registerButton.click();
      
      console.log('Waiting for account creation and redirection to home page...');
      
      // Add network request monitoring
      const networkLogs = [];
      await driver.executeScript(`
        window.networkLogs = [];
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
          const startTime = Date.now();
          try {
            const response = await originalFetch.apply(this, args);
            const endTime = Date.now();
            window.networkLogs.push({
              url: args[0],
              method: args[1]?.method || 'GET',
              status: response.status,
              duration: endTime - startTime
            });
            return response;
          } catch (error) {
            window.networkLogs.push({
              url: args[0],
              method: args[1]?.method || 'GET',
              error: error.message
            });
            throw error;
          }
        };
      `);
      
      try {
        await driver.wait(until.urlContains('/home'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        if (currentUrl.includes('/home')) {
          console.log('Step 3 PASS: Successfully created account and redirected to home page');
          
          await driver.sleep(2000);
          
          const homePageScreenshot = await driver.takeScreenshot();
          fs.writeFileSync('3_successful_registration.png', homePageScreenshot, 'base64');
          console.log('Screenshot saved: 3_successful_registration.png');
          
          console.log('TEST PASSED: User successfully registered');
        } else {
          console.log(`Step 3 FAIL: Not redirected to home page. Current URL: ${currentUrl}`);
          throw new Error('Failed to redirect to home page after registration');
        }
      } catch (error) {
        // Get network logs
        const logs = await driver.executeScript('return window.networkLogs;');
        console.log('Network request logs:', JSON.stringify(logs, null, 2));
        
        console.error('Step 3 FAIL: Timeout waiting for redirection or account creation');
        throw error;
      }
      
    } catch (error) {
      console.error('Test step failed:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`register_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runRegisterTest().catch(error => {
  console.error('Test execution failed:', error.message);
});