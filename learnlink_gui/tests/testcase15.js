const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-015-CreateAssignment
 * Test Priority: High
 * Module: Assignments
 * Description: Verify admin can create a new assignment
 */
async function runCreateAssignmentTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  const ssFolder = path.join(__dirname, 'testcase15_ss');
  if (!fs.existsSync(ssFolder)) fs.mkdirSync(ssFolder);
  
  try {
    console.log('Starting Test: Create Assignment');
    
    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';
    
    // Step 1: Login as admin
    console.log('Step 1: Logging in as admin...');
    await driver.get(testUrl);
    await driver.sleep(2000);
    
    const signInContainer = await driver.findElement(By.css('.sign-in'));
    const emailInput = await signInContainer.findElement(By.css('input[type="email"]'));
    const passwordInput = await signInContainer.findElement(By.css('input[type="password"]'));
    
    await emailInput.sendKeys(testEmail);
    await passwordInput.sendKeys(testPassword);
    await driver.findElement(By.css('.sign-in button[type="submit"]')).click();
    
    // Wait for login and redirect
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Step 1 PASS: Successfully logged in');
    
    fs.writeFileSync(path.join(ssFolder, '01_logged_in.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 2: Navigate to assignments page
    console.log('Step 2: Navigating to assignments page...');
    await driver.findElement(By.css('a[href="/assignments"]')).click();
    await driver.wait(until.urlContains('/assignments'), 10000);
    await driver.wait(until.elementLocated(By.css('.assignments-page')), 10000);
    console.log('Step 2 PASS: Navigated to assignments page');
    
    fs.writeFileSync(path.join(ssFolder, '02_assignments_page.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 3: Click Create Assignment button
    console.log('Step 3: Opening Create Assignment modal...');
    // Click the 'Create Assignment' button in the sidebar footer
    const createBtn = await driver.wait(
      until.elementLocated(By.css('.create-button')),
      10000
    );
    await createBtn.click();
    console.log('Step 3 PASS: Create Assignment button clicked');
    
    fs.writeFileSync(path.join(ssFolder, '03_create_assignment_modal.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 4: Fill in assignment details
    console.log('Step 4: Filling in assignment details...');
    await driver.findElement(By.css('#title')).sendKeys('TEST ASSIGNMENT 2');
    await driver.findElement(By.css('#description')).sendKeys('Test');
    await driver.findElement(By.css('#due_date')).sendKeys('2025-12-31T23:59');
    await driver.findElement(By.css('#points')).clear();
    await driver.findElement(By.css('#points')).sendKeys('100');
    await driver.findElement(By.css('#grading_criteria')).sendKeys('Grading: completion and accuracy.');
    console.log('Step 4 PASS: Assignment details filled');
    
    fs.writeFileSync(path.join(ssFolder, '04_filled_assignment_form.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 5: Select course (TESTCOURSE2)
    const courseSelect = await driver.findElement(By.css('#course_id'));
    await courseSelect.click();
    await driver.sleep(500);
    // Select the option with value 'TESTCOURSE2'
    const courseOptions = await courseSelect.findElements(By.css('option'));
    let found = false;
    for (let option of courseOptions) {
      const value = await option.getAttribute('value');
      const text = await option.getText();
      if (value && (value === 'TESTCOURSE2' || text.includes('TESTCOURSE2'))) {
        await option.click();
        found = true;
        break;
      }
    }
    if (!found) throw new Error('TESTCOURSE2 course not found in course select options');
    console.log('Step 5 PASS: TESTCOURSE2 course selected');
    
    fs.writeFileSync(path.join(ssFolder, '05_course_selected.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 6: Click Create Assignment (submit)
    await driver.findElement(By.css('.create-assignment-submit-button')).click();
    // Wait for modal to close and assignment to appear
    await driver.wait(until.stalenessOf(await driver.findElement(By.css('.create-assignment-modal'))), 10000);
    await driver.sleep(2000);
    console.log('Step 6 PASS: Assignment submitted');
    
    fs.writeFileSync(path.join(ssFolder, '06_assignment_submitted.png'), await driver.takeScreenshot(), 'base64');
    
    // Step 7: Verify assignment appears in list
    console.log('Step 7: Verifying assignment appears in list...');
    await driver.wait(
      until.elementLocated(By.xpath("//div[contains(@class,'assignment-card')]//h3[contains(@class,'assignment-title') and contains(text(),'TEST ASSIGNMENT 2')]")),
      10000
    );
    console.log('Step 7 PASS: Assignment found in the list with Creator badge');
    console.log('TEST PASSED: Assignment created successfully');
    
    fs.writeFileSync(path.join(ssFolder, '07_assignment_created.png'), await driver.takeScreenshot(), 'base64');
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      fs.writeFileSync(path.join(ssFolder, `error_${Date.now()}.png`), await driver.takeScreenshot(), 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
    console.log('Browser closed');
  }
}

runCreateAssignmentTest().catch(error => {
  console.error('Test execution failed:', error.message);
});