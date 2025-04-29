const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-001-Login
 * Test Priority: High
 * Module: Authentication
 * Description: Verify user can log in with valid credentials
 */
async function runLoginTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Login Test (LL-TC-001-Login)');
    
    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';
    
    console.log('Step 1: Opening login page...');
    await driver.get(testUrl);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_page.png', loginPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_login_page.png');
    
    await driver.sleep(3000);
    
    try {
      const signInContainer = await driver.findElement(By.css('.sign-in'));
      console.log('Step 1 PASS: Login form appears');
      
      console.log('Step 2: Entering email...');
      const emailInput = await signInContainer.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys(testEmail);
      console.log(`Step 2 PASS: Email '${testEmail}' is entered`);
      
      console.log('Step 3: Entering password...');
      const passwordInput = await signInContainer.findElement(By.css('input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys(testPassword);
      console.log('Step 3 PASS: Password is entered');
      
      const credentialsScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_credentials_entered.png', credentialsScreenshot, 'base64');
      console.log('Screenshot saved: 2_credentials_entered.png');
      
      console.log('Step 4: Clicking login button...');
      const loginButton = await signInContainer.findElement(By.css('button[type="submit"]'));
      await loginButton.click();
      
      console.log('Waiting for redirection to home page...');
      try {
        await driver.wait(until.urlContains('/home'), 10000);
        const currentUrl = await driver.getCurrentUrl();
        
        if (currentUrl.includes('/home')) {
          console.log('Step 4 PASS: Successfully redirected to home page');
          
          await driver.sleep(2000);
          
          const homePageScreenshot = await driver.takeScreenshot();
          fs.writeFileSync('3_successful_login.png', homePageScreenshot, 'base64');
          console.log('Screenshot saved: 3_successful_login.png');
          
          console.log('TEST PASSED: User successfully logged in with valid credentials');
        } else {
          console.log(`Step 4 FAIL: Not redirected to home page. Current URL: ${currentUrl}`);
          throw new Error('Failed to redirect to home page after login');
        }
      } catch (error) {
        console.error('Step 4 FAIL: Timeout waiting for redirection');
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
      fs.writeFileSync(`login_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runLoginTest().catch(error => {
  console.error('Test execution failed:', error.message);
});