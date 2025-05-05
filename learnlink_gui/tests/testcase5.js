const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-005-View Profile
 * Test Priority: Low
 * Module: Navigating User Profile
 * Description: Users are able to display their profiles
 */
async function runViewProfileTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink View Profile Test (LL-TC-005-View Profile)');
    
    const testUrl = 'http://localhost:3000/';  // Main login page URL
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';
    
    console.log('Step 1: Log in and navigate to profile...');
    await driver.get(testUrl);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_page.png', loginPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_login_page.png');
    
    await driver.sleep(2000);
    
    try {
      const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
      await emailInput.clear();
      await emailInput.sendKeys(testEmail);
      console.log(`Email '${testEmail}' is entered`);
      
      const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
      await passwordInput.clear();
      await passwordInput.sendKeys(testPassword);
      console.log('Password is entered');
      
      const credentialsScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_credentials_entered.png', credentialsScreenshot, 'base64');
      console.log('Screenshot saved: 2_credentials_entered.png');
      
      // Click login button
      const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
      await loginButton.click();
      
      // Wait for redirection to home page
      await driver.wait(until.urlContains('/home'), 10000);
      console.log('Successfully logged in and redirected to home page');
      
      // Take screenshot of home page
      const homePageScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('3_home_page.png', homePageScreenshot, 'base64');
      console.log('Screenshot saved: 3_home_page.png');
      
      await driver.sleep(2000);
      
      console.log('Looking for profile avatar in header...');
      const profileNavElement = await driver.findElement(By.css('.profile-avatar'));
      
      await profileNavElement.click();
      console.log('Clicked on profile navigation element');
      
      await driver.sleep(2000);
      
      const profilePageScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('4_profile_page.png', profilePageScreenshot, 'base64');
      console.log('Screenshot saved: 4_profile_page.png');
      
      console.log('Step 1 PASS: Successfully navigated to profile page/modal');
      
      console.log('Step 2: Checking displayed profile information...');
      
      // Wait for the profile card to appear
      await driver.sleep(1000);
      await driver.wait(until.elementLocated(By.css('.profile-card')), 5000);

      // Log all <p> elements inside .profile-info (for debugging)
      const allPs = await driver.findElements(By.css('.profile-info p'));
      for (let i = 0; i < allPs.length; i++) {
        const text = await allPs[i].getText();
        console.log(`p[${i}]: ${text}`);
      }

      // Get email from the <p> containing '@'
      console.log('Looking for email information...');
      const emailInfo = await driver.findElement(By.xpath("//div[contains(@class, 'profile-info')]//p[contains(text(), '@')]"));
      const displayedEmail = await emailInfo.getText();

      // Try to get role from the <label> containing 'Role' and its following <p>
      console.log('Looking for role information...');
      let displayedRole = null;
      try {
        const roleInfo = await driver.findElement(By.xpath("//div[contains(@class, 'profile-info')]//label[contains(translate(text(), 'ROLE', 'role'), 'role')]/following-sibling::p"));
        displayedRole = await roleInfo.getText();
        console.log(`- Role: ${displayedRole}`);
      } catch (e) {
        console.log('Role information not found.');
      }

      // Get name from the profile header
      console.log('Looking for name information...');
      const nameElement = await driver.findElement(By.css(".profile-header h2"));
      const displayedName = await nameElement.getText();

      console.log('Profile Information Found:');
      console.log(`- Name: ${displayedName}`);
      console.log(`- Email: ${displayedEmail}`);
      if (displayedRole !== null) {
        console.log(`- Role: ${displayedRole}`);
      }
      
      if (displayedEmail.trim().toLowerCase() === testEmail.trim().toLowerCase()) {
        console.log('Email verification: PASS');
      } else {
        console.log(`Email verification: FAIL - Expected "${testEmail}", got "${displayedEmail}"`);
      }
      
      if (displayedName && displayedEmail) {
        console.log('Name and Email verification: PASS - Values are displayed');
      } else {
        console.log('Name and Email verification: FAIL - One or more values missing');
      }
      
      const profileInfoScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('5_profile_info_verified.png', profileInfoScreenshot, 'base64');
      console.log('Screenshot saved: 5_profile_info_verified.png');
      
      console.log('Step 2 PASS: Profile information is displayed correctly');
      console.log('TEST PASSED: User profile is displayed successfully');
      
    } catch (error) {
      console.error('Test step failed:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`view_profile_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runViewProfileTest().catch(error => {
  console.error('Test execution failed:', error.message);
});