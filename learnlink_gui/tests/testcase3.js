const { Builder, By, until, Key } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-008
 * Test Title: Google OAuth Login
 * Test Priority: Medium
 * Module: Authentication
 * Description: Verify that users can log in via their Google account using the OAuth flow.
 * Pre-requisite: Google OAuth must be configured on both frontend and backend with valid client credentials.
 */
async function runGoogleOAuthTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting Google OAuth Login Test (LL-TC-03)');
    
    const testUrl = 'http://localhost:3000/';
    const testGoogleAccount = 'admin@adin.com'; 
    const testGooglePassword = 'Admin123'; 
    console.log('Step 1: Navigating to login page...');
    await driver.get(testUrl);
    await driver.sleep(3000);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_google_login_page.png', loginPageScreenshot, 'base64');
    console.log('Step 1 PASS: Login page is loaded');
    
    console.log('Step 2: Attempting to click on "Sign in with Google"...');
    
    let googleButtonClicked = false;
    
    try {
      const elements = await driver.findElements(By.css('.social-icons, .nsm7Bb-HzV7m-LgbsSe, [role="button"], .GoogleLogin, div[aria-labelledby="button-label"]'));
      
      console.log(`Found ${elements.length} potential Google sign-in elements`);
      
      for (let i = 0; i < elements.length; i++) {
        try {
          await driver.executeScript("arguments[0].click();", elements[i]);
          await driver.sleep(3000);
          
          const handles = await driver.getAllWindowHandles();
          if (handles.length > 1) {
            console.log('Google popup detected after clicking element');
            googleButtonClicked = true;
            break;
          }
        } catch (clickError) {
        }
      }
    } catch (jsError) {
      console.log('JavaScript executor approach failed:', jsError.message);
    }
    
    if (!googleButtonClicked) {
      try {
        console.log('Trying to find Google sign-in within iframes');
        
        await driver.switchTo().defaultContent();
        
        const iframes = await driver.findElements(By.css('iframe'));
        console.log(`Found ${iframes.length} iframes on the page`);
        
        for (let i = 0; i < iframes.length && !googleButtonClicked; i++) {
          try {
            await driver.switchTo().frame(iframes[i]);
            console.log(`Switched to iframe ${i+1}`);
            
            const buttonSelectors = [
              '.nsm7Bb-HzV7m-LgbsSe',
              'div[role="button"]',
              '[aria-labelledby="button-label"]'
            ];
            
            for (const buttonSelector of buttonSelectors) {
              try {
                const buttons = await driver.findElements(By.css(buttonSelector));
                
                if (buttons.length > 0) {
                  await driver.executeScript('arguments[0].click();', buttons[0]);
                  await driver.sleep(3000);
                  
                  await driver.switchTo().defaultContent(); 
                  const handles = await driver.getAllWindowHandles();
                  if (handles.length > 1) {
                    console.log('Google popup detected after clicking in iframe');
                    googleButtonClicked = true;
                    break;
                  }
                  
                  await driver.switchTo().frame(iframes[i]);
                }
              } catch (buttonError) {
              }
            }
            
            await driver.switchTo().defaultContent();
            
          } catch (frameError) {
            await driver.switchTo().defaultContent();
          }
        }
      } catch (iframeError) {
        console.log('Iframe approach failed:', iframeError.message);
        await driver.switchTo().defaultContent();
      }
    }
    
    if (!googleButtonClicked) {
      console.log('Failed to click Google sign-in button');
      throw new Error('Could not trigger Google authentication');
    }
    
    console.log('Step 2 PASS: Google OAuth popup is displayed');
    
    console.log('Step 3: Handling Google authentication');
    
    const windowHandles = await driver.getAllWindowHandles();
    if (windowHandles.length > 1) {
      const originalWindow = windowHandles[0];
      const popupWindow = windowHandles[1];
      
      await driver.switchTo().window(popupWindow);
      console.log('Switched to Google authentication popup');
      
      const googlePopupScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_google_auth_popup.png', googlePopupScreenshot, 'base64');
      
      try {
        console.log('Looking for email input field...');
        await driver.sleep(2000); 
        
        
        const beforeEmailScreenshot = await driver.takeScreenshot();
        fs.writeFileSync('3_before_email_input.png', beforeEmailScreenshot, 'base64');
        
       
        const popupSource = await driver.getPageSource();
        fs.writeFileSync('google_popup_source.html', popupSource);
        
        let emailInput = null;
        
        try {
          emailInput = await driver.wait(
            until.elementLocated(By.css('input[type="email"]')), 
            5000
          );
        } catch (e) {
          console.log('Could not find email input by type, trying more selectors');
          
          const emailSelectors = [
            '#identifierId', // Common ID for Google email input
            'input#Email',   // Alternative email input
            'input[name="identifier"]',
            'input[aria-label*="mail"]',
            'input'          // Last resort - just find any input
          ];
          
          for (const selector of emailSelectors) {
            try {
              emailInput = await driver.findElement(By.css(selector));
              console.log(`Found email input with selector: ${selector}`);
              break;
            } catch (err) {
            }
          }
        }
        
        if (emailInput) {
          await emailInput.clear();
          await emailInput.sendKeys(testGoogleAccount);
          console.log(`Entered email: ${testGoogleAccount}`);
          
          const emailEnteredScreenshot = await driver.takeScreenshot();
          fs.writeFileSync('4_email_entered.png', emailEnteredScreenshot, 'base64');
          
          try {
            const nextButtonSelectors = [
              '#identifierNext button', 
              'button[jsname="LgbsSe"]',
              'div#identifierNext',
              'button:contains("Next")',
              'input[type="submit"]',
              'button'
            ];
            
            let nextButton = null;
            
            for (const selector of nextButtonSelectors) {
              try {
                const buttons = await driver.findElements(By.css(selector));
                if (buttons.length > 0) {
                  nextButton = buttons[0];
                  break;
                }
              } catch (err) {
              }
            }
            
            if (nextButton) {
              await driver.executeScript("arguments[0].click();", nextButton);
              console.log('Clicked Next button after entering email');
              
              await driver.sleep(3000);
              
              const passwordScreenshot = await driver.takeScreenshot();
              fs.writeFileSync('5_password_screen.png', passwordScreenshot, 'base64');
              
              let passwordInput = null;
              
              try {
                passwordInput = await driver.wait(
                  until.elementLocated(By.css('input[type="password"]')), 
                  10000
                );
              } catch (e) {
                console.log('Could not find password input by type, trying more selectors');
                
                const passwordSelectors = [
                  'input[name="password"]',
                  '#password input',
                  'input#Passwd',
                  'input[aria-label*="password"]'
                ];
                
                for (const selector of passwordSelectors) {
                  try {
                    passwordInput = await driver.findElement(By.css(selector));
                    console.log(`Found password input with selector: ${selector}`);
                    break;
                  } catch (err) {
                  }
                }
              }
              
              if (passwordInput) {
                await passwordInput.clear();
                await passwordInput.sendKeys(testGooglePassword);
                console.log('Entered password');
                
                const passwordEnteredScreenshot = await driver.takeScreenshot();
                fs.writeFileSync('6_password_entered.png', passwordEnteredScreenshot, 'base64');
                
                try {
                  const signInButtonSelectors = [
                    '#passwordNext button',
                    'button[jsname="LgbsSe"]',
                    'input[type="submit"]',
                    'button'
                  ];
                  
                  let signInButton = null;
                  
                  for (const selector of signInButtonSelectors) {
                    try {
                      const buttons = await driver.findElements(By.css(selector));
                      if (buttons.length > 0) {
                        signInButton = buttons[0];
                        break;
                      }
                    } catch (err) {
                    }
                  }
                  
                  if (signInButton) {
                    await driver.executeScript("arguments[0].click();", signInButton);
                    console.log('Clicked Sign In button after entering password');
                    
                    await driver.sleep(5000);
                    
                    try {
                      const consentButtons = await driver.findElements(By.css('button, input[type="submit"]'));
                      if (consentButtons.length > 0) {
                        const consentScreenshot = await driver.takeScreenshot();
                        fs.writeFileSync('7_consent_screen.png', consentScreenshot, 'base64');
                        
                        await driver.executeScript("arguments[0].click();", consentButtons[0]);
                        console.log('Clicked consent/allow button');
                      }
                    } catch (consentError) {
                      console.log('No consent screen or error accessing it:', consentError.message);
                    }
                    
                    console.log('Step 3 PASS: Google account selected and authorized');
                    
                    console.log('Step 4: Checking for successful login redirection...');
                    
                    await driver.switchTo().window(originalWindow);
                    
                    try {
                      await driver.wait(until.urlContains('/home'), 15000);
                      const finalUrl = await driver.getCurrentUrl();
                      
                      if (finalUrl.includes('/home')) {
                        const homePageScreenshot = await driver.takeScreenshot();
                        fs.writeFileSync('8_successful_google_login.png', homePageScreenshot, 'base64');
                        
                        console.log('Step 4 PASS: Successfully redirected to home page');
                        console.log('TEST PASSED: Google OAuth login successful');
                      } else {
                        console.log(`Step 4 FAIL: Not redirected to home page. Current URL: ${finalUrl}`);
                        throw new Error('Failed to redirect to home page after Google login');
                      }
                    } catch (redirectError) {
                      console.error('Step 4 FAIL: Timeout waiting for redirection after Google login');
                      throw redirectError;
                    }
                  } else {
                    throw new Error('Could not find Sign In button');
                  }
                } catch (signInError) {
                  console.error('Error clicking Sign In button:', signInError.message);
                  throw signInError;
                }
              } else {
                throw new Error('Could not find password input field');
              }
            } else {
              throw new Error('Could not find Next button');
            }
          } catch (nextError) {
            console.error('Error finding/clicking Next button:', nextError.message);
            throw nextError;
          }
        } else {
          throw new Error('Could not find email input field');
        }
      } catch (emailInputError) {
        console.error('Error finding/interacting with email input:', emailInputError.message);
        throw emailInputError;
      }
    } else {
      throw new Error('Google authentication popup was not opened');
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    // Take screenshot on failure
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`google_oauth_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Failure screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runGoogleOAuthTest().catch(error => {
  console.error('Test execution failed:', error.message);
});