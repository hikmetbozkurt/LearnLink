const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-022-Submit Homework
 * Test Priority: High
 * Module: Assignment Submission
 * Description: Student submits a homework file (hw.docx) to a course
 */
async function runSubmitHomeworkTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting LearnLink Submit Homework Test (LL-TC-022-Submit Homework)');

    // Test data
    const testUrl = 'http://localhost:3000/';
    const studentEmail = 'hamdi@hamdi.com';
    const studentPassword = 'Hamdi123';
    const homeworkPath = path.join(__dirname, 'test.docx');

    // Step 1: Login
    console.log('Step 1: Logging in as student...');
    await driver.get(testUrl);
    await driver.sleep(2000);

    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(studentEmail);

    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(studentPassword);

    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();

    // Wait for login and redirect
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Successfully logged in');

    // Step 2: Click on Assignments in sidebar
    console.log('Step 2: Clicking on Assignments in sidebar...');
    await driver.sleep(2000); // Wait for sidebar to load
    const assignmentsLink = await driver.findElement(By.xpath("//span[text()='Assignments']"));
    await driver.executeScript("arguments[0].click();", assignmentsLink);
    await driver.sleep(2000);

    // Step 3: Wait for assignments page to load and click on first assignment
    console.log('Step 3: Clicking on first available assignment...');
    await driver.wait(until.elementLocated(By.css('.assignment-card')), 10000);
    const assignmentCard = await driver.findElement(By.css('.assignment-card'));
    await driver.executeScript("arguments[0].click();", assignmentCard);
    await driver.sleep(2000);

    // Step 4: Click Submit Assignment button
    console.log('Step 4: Clicking Submit Assignment button...');
    const submitButton = await driver.findElement(By.css('.submit-button'));
    await driver.executeScript("arguments[0].click();", submitButton);
    await driver.sleep(2000);

    // Step 5: Fill submission form
    console.log('Step 5: Filling submission form...');
    
    // Enter text
    const textArea = await driver.findElement(By.css('#content'));
    await textArea.clear();
    await textArea.sendKeys('submission test');
    
    // Upload file
    const fileInput = await driver.findElement(By.css('#file-upload'));
    await fileInput.sendKeys(homeworkPath);
    await driver.sleep(2000);

    // Take screenshot of filled form
    const formScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_filled_form.png', formScreenshot, 'base64');

    // Step 6: Submit the form
    console.log('Step 6: Submitting the form...');
    // Wait for the submit button in the modal to be present and enabled
    await driver.wait(until.elementLocated(By.css('.sa-submit-button')), 5000);
    const submitFormButton = await driver.findElement(By.css('.sa-submit-button'));
    await driver.wait(until.elementIsEnabled(submitFormButton), 5000);
    await driver.executeScript("arguments[0].click();", submitFormButton);
    await driver.sleep(3000); // Wait for submission to process

    // Step 7: Verify submission
    try {
      // Wait for success message or submitted status
      await driver.wait(
        until.elementLocated(By.xpath("//*[contains(@class, 'status-submitted') or contains(text(), 'Assignment submitted successfully')]")),
        5000
      );
      console.log('TEST PASSED: Homework submitted successfully');
      
      const successScreenshot = await driver.takeScreenshot();
      fs.writeFileSync('2_submission_success.png', successScreenshot, 'base64');
    } catch (error) {
      throw new Error('Could not verify successful homework submission');
    }

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      const failureFile = `homework_submission_failure_${Date.now()}.png`;
      fs.writeFileSync(failureFile, screenshot, 'base64');
      console.log('Failure screenshot saved:', failureFile);
    } catch (screenshotError) {
      console.error('Failed to capture error screenshot:', screenshotError.message);
    }
    
    throw error;
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runSubmitHomeworkTest().catch(error => {
  console.error('Test execution failed:', error.message);
  process.exit(1);
});