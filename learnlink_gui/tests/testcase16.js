const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: LL-TC-016-View Submitted Assignment File as Admin
 * Test Priority: High
 * Module: Assignment Submission
 * Description: Admin logs in, navigates to Assignments > Submitted, clicks a submitted assignment, and views the submitted file.
 */
async function runViewSubmittedFileTest() {
  const driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log('Starting LearnLink View Submitted File Test (LL-TC-016)');

    // Test data
    const testUrl = 'http://localhost:3000/';
    const adminEmail = 'admin@admin.com';
    const adminPassword = 'Admin123';

    // Step 1: Login
    console.log('Step 1: Logging in as admin...');
    await driver.get(testUrl);
    await driver.sleep(2000);

    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(adminEmail);

    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(adminPassword);

    const loginScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_admin_login_filled.png', loginScreenshot, 'base64');

    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();

    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Login successful and redirected to /home');

    const homeScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_admin_home_page.png', homeScreenshot, 'base64');

    // Step 2: Click on Assignments in sidebar
    console.log('Step 2: Clicking on Assignments in sidebar...');
    await driver.sleep(2000);
    const assignmentsLink = await driver.findElement(By.xpath("//span[text()='Assignments']"));
    await driver.executeScript("arguments[0].click();", assignmentsLink);
    await driver.sleep(2000);

    const assignmentsScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('3_assignments_sidebar.png', assignmentsScreenshot, 'base64');

    // Step 3: Click on Submitted tab
    console.log('Step 3: Clicking on Submitted tab...');
    const submittedTab = await driver.findElement(By.xpath("//span[contains(text(),'Submitted')]"));
    await driver.executeScript("arguments[0].click();", submittedTab);
    await driver.sleep(2000);

    const submittedTabScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('4_submitted_tab.png', submittedTabScreenshot, 'base64');

    // Step 4: Click on first submitted assignment card
    console.log('Step 4: Clicking on first submitted assignment card...');
    await driver.wait(until.elementLocated(By.css('.assignment-card')), 10000);
    const assignmentCard = await driver.findElement(By.css('.assignment-card'));
    await driver.executeScript("arguments[0].click();", assignmentCard);
    await driver.sleep(2000);

    const assignmentDetailScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('5_assignment_detail.png', assignmentDetailScreenshot, 'base64');

    // Step 5: Click on "View Submitted File"
    console.log('Step 5: Clicking on View Submitted File...');
    await driver.wait(until.elementLocated(By.xpath("//a[contains(.,'View Submitted File')]")), 10000);
    const viewFileLink = await driver.findElement(By.xpath("//a[contains(.,'View Submitted File')]"));
    await driver.executeScript("arguments[0].click();", viewFileLink);
    await driver.sleep(2000);

    const viewFileScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('6_view_submitted_file.png', viewFileScreenshot, 'base64');

    console.log('TEST PASSED: Admin was able to view the submitted file.');

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    const failShot = await driver.takeScreenshot();
    const failFile = `view_submitted_file_failure_${Date.now()}.png`;
    fs.writeFileSync(failFile, failShot, 'base64');
    console.log('Screenshot saved:', failFile);
  } finally {
    await driver.quit();
    console.log('🧹 Browser closed');
  }
}

runViewSubmittedFileTest().catch(err => console.error('Unhandled Exception:', err.message));