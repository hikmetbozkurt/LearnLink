const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: 014-Logout
 * Test Priority: Medium
 * Module: Authentication
 * Description: Ensure session ends and user redirected
 */
async function runLogoutTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Logout Test (015-Logout)');
    
    // Test data
    const testUrl = 'http://localhost:3000/';  // Main login page URL
    const userEmail = 'admin@admin.com';       // Using admin credentials
    const userPassword = 'Admin123';
    
    console.log('Step 0: Logging in to the application...');
    await driver.get(testUrl);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_page.png', loginPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_login_page.png');
    
    await driver.sleep(2000);
    
    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(userEmail);
    console.log(`Email '${userEmail}' is entered`);
    
    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(userPassword);
    console.log('Password is entered');
    
    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();
    
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Successfully logged in');
    
    const loggedInScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_logged_in.png', loggedInScreenshot, 'base64');
    console.log('Screenshot saved: 2_logged_in.png');
    
    console.log('Step 1: Looking for Logout option in settings...');
    
    try {
      console.log('Waiting for toast notifications to disappear...');
      try {
        await driver.wait(until.stalenessOf(await driver.findElement(By.css('.toast'))), 5000);
      } catch (toastError) {
        console.log('No toast found or already disappeared');
      }
      
      await driver.sleep(1000);
      
      console.log('Looking for settings icon in header...');
      const settingsIcon = await driver.findElement(By.css('.settings-icon'));
      
      await driver.executeScript("arguments[0].scrollIntoView(true);", settingsIcon);
      await driver.sleep(500); // Wait for scroll to complete
      
      try {
        await settingsIcon.click();
      } catch (clickError) {
        console.log('Direct click failed, trying JavaScript click...');
        await driver.executeScript("arguments[0].click();", settingsIcon);
      }
      console.log('Clicked on settings icon');
      
      await driver.sleep(1000);
      
      const logoutOption = await driver.findElement(
        By.xpath('//div[contains(@class, "dropdown-menu")]//div[contains(@class, "menu-item") and .//span[contains(text(), "Logout")]]')
      );
      await logoutOption.click();
      console.log('Clicked on Logout option');
      
    } catch (error) {
      console.log('Could not find logout in settings menu:', error.message);
      console.log('Trying to find settings icon by SVG...');
      
      try {
        const settingsIcon = await driver.findElement(By.css('svg[data-icon="cog"]'));
        
        await driver.executeScript("arguments[0].scrollIntoView(true);", settingsIcon);
        await driver.sleep(500); // Wait for scroll to complete
        
        try {
          await settingsIcon.click();
        } catch (clickError) {
          console.log('Direct click failed, trying JavaScript click...');
          await driver.executeScript("arguments[0].click();", settingsIcon);
        }
        console.log('Clicked on settings icon (SVG)');
        
        await driver.sleep(1000);
        
        const logoutOption = await driver.findElement(
          By.xpath('//div[contains(@class, "dropdown-menu")]//div[contains(@class, "menu-item") and .//span[contains(text(), "Logout")]]')
        );
        await logoutOption.click();
        console.log('Clicked on Logout option');
        
      } catch (iconError) {
        console.log('Could not find settings icon:', iconError.message);
        console.log('Trying to find any element with settings or logout text...');
        
        const settingsElements = await driver.findElements(
          By.xpath('//*[contains(text(), "Settings") or contains(text(), "Logout") or contains(text(), "Sign out")]')
        );
        
        if (settingsElements.length > 0) {
          await settingsElements[0].click();
          console.log('Clicked on settings/logout element');
          
          await driver.sleep(1000);
          
          try {
            const logoutOption = await driver.findElement(
              By.xpath('//div[contains(@class, "dropdown-menu")]//div[contains(@class, "menu-item") and .//span[contains(text(), "Logout")]]')
            );
            await logoutOption.click();
            console.log('Clicked on Logout option from dropdown');
          } catch (dropdownError) {
            console.log('No dropdown found after clicking settings element');
          }
        } else {
          throw new Error('Could not find any settings or logout element');
        }
      }
    }
    
    const afterLogoutClickScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('3_after_logout_click.png', afterLogoutClickScreenshot, 'base64');
    console.log('Screenshot saved: 3_after_logout_click.png');
    
    console.log('Waiting for redirection to login page...');
    try {
      await driver.wait(until.urlContains('/login'), 10000);
    } catch (urlError) {
      const currentUrl = await driver.getCurrentUrl();
      if (currentUrl === testUrl) {
        console.log('Redirected to main URL, which is also acceptable');
      } else {
        throw new Error(`Not redirected to login page. Current URL: ${currentUrl}`);
      }
    }
    
    const currentUrl = await driver.getCurrentUrl();
    console.log(`Current URL after logout: ${currentUrl}`);
    
    const loginPageAfterLogoutScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('4_login_page_after_logout.png', loginPageAfterLogoutScreenshot, 'base64');
    console.log('Screenshot saved: 4_login_page_after_logout.png');
    
    console.log('Step 2: Refreshing page to verify logged out state persists...');
    await driver.navigate().refresh();
    
    await driver.sleep(2000);
    
    const afterRefreshScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('5_after_refresh.png', afterRefreshScreenshot, 'base64');
    console.log('Screenshot saved: 5_after_refresh.png');
    
    const urlAfterRefresh = await driver.getCurrentUrl();
    console.log(`URL after refresh: ${urlAfterRefresh}`);
    
    try {
      await driver.findElement(By.css('.sign-in, form:has(input[type="email"])'));
      console.log('Login form is visible, confirming logged out state');
      console.log('TEST PASSED: Logout functionality works correctly');
    } catch (error) {
      console.error('Could not find login form after refresh:', error.message);
      throw new Error('Could not confirm logged out state after refresh');
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`logout_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
    try {
      const pageSource = await driver.getPageSource();
      fs.writeFileSync(`logout_failure_page_${Date.now()}.html`, pageSource, 'utf8');
      console.log('Page source saved for debugging');
    } catch (sourceError) {
      console.error('Failed to capture page source:', sourceError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runLogoutTest().catch(error => {
  console.error('Test execution failed:', error.message);
});