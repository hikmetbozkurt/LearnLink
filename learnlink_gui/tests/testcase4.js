const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-004-Reset Password
 * Test Priority: Medium
 * Module: Authentication
 * Description: Ensure reset password flow works properly
 */
async function runResetPasswordTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Reset Password Test (LL-TC-004-Reset Password)');
    
    const testUrl = 'http://localhost:3000/';  // Main login page URL
    const testEmail = 'admin@admin.com';
    const newPassword = '654321';
    
    console.log('Step 1: Opening login page and clicking "Forgot Password"...');
    await driver.get(testUrl);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_page.png', loginPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_login_page.png');
    
    await driver.sleep(2000);
    
    try {
      const forgotPasswordLink = await driver.findElement(By.css('.forgot-link'));
      await forgotPasswordLink.click();
      console.log('Step 1 PASS: Clicked on "Forgot Password" link');
      
      await driver.wait(until.urlContains('/forgot-password'), 5000);
      console.log('Successfully redirected to reset password form');
      
      const resetFormScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_reset_form.png', resetFormScreenshot, 'base64');
      console.log('Screenshot saved: 2_reset_form.png');
      
      console.log('Step 2: Entering registered email...');
      const emailInput = await driver.findElement(By.css('input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys(testEmail);
      console.log(`Step 2 PASS: Email '${testEmail}' is entered`);
      
      const submitButton = await driver.findElement(By.css('button[type="submit"]'));
      await submitButton.click();
      
      const resetRequestScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('3_reset_request_submitted.png', resetRequestScreenshot, 'base64');
      console.log('Screenshot saved: 3_reset_request_submitted.png');
      
      await driver.wait(until.elementLocated(By.css('.success-message, .alert-success')), 5000);
      console.log('Reset link sent confirmation message appeared');
      
      console.log('Step 3: Simulating opening reset link and entering new password...');
      console.log('NOTE: In a real environment, you would need to extract the actual reset link from the email');
      
      const simulatedResetLink = 'http://localhost:3000/reset-password?token=sample-token';
      await driver.get(simulatedResetLink);
      
      await driver.sleep(2000);
      
      const newPasswordInput = await driver.findElement(By.css('input[type="password"]'));
      await newPasswordInput.clear();
      await newPasswordInput.sendKeys(newPassword);
      
      try {
        const confirmPasswordInput = await driver.findElement(By.css('input[placeholder="Confirm Password"]'));
        await confirmPasswordInput.clear();
        await confirmPasswordInput.sendKeys(newPassword);
      } catch (error) {
        console.log('No confirm password field found - continuing with test');
      }
      
      const resetPasswordButton = await driver.findElement(By.css('button[type="submit"]'));
      await resetPasswordButton.click();
      
      const newPasswordScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('4_new_password_submitted.png', newPasswordScreenshot, 'base64');
      console.log('Screenshot saved: 4_new_password_submitted.png');
      
      await driver.wait(
        until.elementLocated(By.css('.success-message, .alert-success')), 
        5000, 
        'Success message not found after password reset'
      ).catch(() => {
        return driver.wait(until.urlContains('/login'), 5000);
      });
      
      console.log('Step 3 PASS: Password has been updated');      
      console.log('Step 4: Trying login with new password...');
      
      await driver.get(testUrl);
      await driver.sleep(2000);
      
      const loginEmailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
      await loginEmailInput.clear();
      await loginEmailInput.sendKeys(testEmail);
      
      const loginPasswordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
      await loginPasswordInput.clear();
      await loginPasswordInput.sendKeys(newPassword);
      
      const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
      await loginButton.click();
      
      await driver.wait(until.urlContains('/home'), 10000);
      const currentUrl = await driver.getCurrentUrl();
      
      if (currentUrl.includes('/home')) {
        console.log('Step 4 PASS: Successfully logged in with new password');
        
        const successfulLoginScreenshot = await driver.takeScreenshot();
        fs.writeFileSync('5_successful_login.png', successfulLoginScreenshot, 'base64');
        console.log('Screenshot saved: 5_successful_login.png');
        
        console.log('TEST PASSED: Reset password flow works properly');
      } else {
        console.log(`Step 4 FAIL: Login with new password failed. Current URL: ${currentUrl}`);
        throw new Error('Failed to login with new password');
      }
      
    } catch (error) {
      console.error('Test step failed:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`reset_password_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runResetPasswordTest().catch(error => {
  console.error('Test execution failed:', error.message);
});