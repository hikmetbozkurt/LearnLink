const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');

/**
 * Test Case: 013-Join Course
 * Test Priority: High
 * Module: Course Enrollment
 * Description: Students can join courses
 */
async function runJoinCourseTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  
  try {
    console.log('Starting LearnLink Join Course Test (013-Join Course)');
    
    // Test data
    const testUrl = 'http://localhost:3000/';  // Main login page URL
    const studentEmail = 'admin@admin.com';    // Use credentials
    const studentPassword = 'Admin123';        // Use password
    
    console.log('Step 0: Logging in with student credentials...');
    await driver.get(testUrl);
    
    const loginPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('1_login_page.png', loginPageScreenshot, 'base64');
    console.log('Screenshot saved: 1_login_page.png');
    
    await driver.sleep(2000);
    
    const emailInput = await driver.findElement(By.css('.sign-in input[type="email"]'));
    await emailInput.clear();
    await emailInput.sendKeys(studentEmail);
    console.log(`Email '${studentEmail}' is entered`);
    
    const passwordInput = await driver.findElement(By.css('.sign-in input[type="password"]'));
    await passwordInput.clear();
    await passwordInput.sendKeys(studentPassword);
    console.log('Password is entered');
    
    // Click login button
    const loginButton = await driver.findElement(By.css('.sign-in button[type="submit"]'));
    await loginButton.click();
    
    // Wait for redirection to home page
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('Successfully logged in as student');
    
    // Navigate to courses page
    console.log('Navigating to courses page...');
    await driver.get('http://localhost:3000/courses');
    
    await driver.wait(until.elementLocated(By.css('.courses-container')), 10000);
    console.log('Courses page loaded successfully');
    
    const coursesPageScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('2_courses_page.png', coursesPageScreenshot, 'base64');
    console.log('Screenshot saved: 2_courses_page.png');
    
    // Find and click Join Course button
    console.log('Step 1: Looking for Join Course button...');
    
    try {
      await driver.wait(until.elementLocated(By.css('.join-button')), 10000);
      
      // Find all join buttons
      const joinButtons = await driver.findElements(By.css('.join-button'));
      console.log(`Found ${joinButtons.length} join buttons`);
      
      if (joinButtons.length > 0) {
        // Store the course card element and title before joining
        const courseCard = await joinButtons[0].findElement(By.xpath('./ancestor::div[contains(@class, "course-card")]'));
        const courseTitle = await courseCard.findElement(By.css('.course-title')).getText();
        console.log(`Attempting to join course: "${courseTitle}"`);
        
        // Take screenshot before joining
        const beforeJoinScreenshot = await driver.takeScreenshot();
        fs.writeFileSync('3_before_join.png', beforeJoinScreenshot, 'base64');
        
        // Click the join button
        await joinButtons[0].click();
        console.log('Clicked on join button');
        await driver.sleep(2000);
        
        const afterClickScreenshot = await driver.takeScreenshot();
        fs.writeFileSync('4_after_click_join.png', afterClickScreenshot, 'base64');
        
        // Verify the join was successful by checking:
        // 1. Success notification
        // 2. Button changed to "View Details"
        // 3. Course appears in My Courses tab
        let joinSuccess = false;
        
        try {
          // Check for success notification
          await driver.wait(
            until.elementLocated(By.xpath("//*[contains(text(), 'Successfully joined the course')]")),
            5000
          );
          console.log('Success notification found');
          joinSuccess = true;
        } catch (notificationError) {
          console.log('No success notification found, checking other indicators...');
        }
        
        try {
          // Check if the button changed to View Details
          await driver.wait(
            until.elementLocated(By.xpath(`//div[contains(@class, "course-card")]//h3[text()="${courseTitle}"]/ancestor::div[contains(@class, "course-card")]//button[contains(@class, "view-details-button")]`)),
            5000
          );
          console.log('Join button changed to View Details');
          joinSuccess = true;
        } catch (buttonError) {
          console.log('Button state change not found, checking My Courses tab...');
        }
        
        if (!joinSuccess) {
          // Click on My Courses tab as final verification
          const myCoursesTab = await driver.findElement(
            By.xpath("//div[contains(@class, 'course-sidebar-nav-item')]//span[text()='My Courses']")
          );
          await myCoursesTab.click();
          await driver.sleep(2000);
          
          // Take screenshot of My Courses view
          const myCoursesScreenshot = await driver.takeScreenshot();
          fs.writeFileSync('5_my_courses_view.png', myCoursesScreenshot, 'base64');
          
          // Look for the course title in My Courses
          try {
            await driver.findElement(
              By.xpath(`//div[contains(@class, "course-card")]//h3[text()="${courseTitle}"]`)
            );
            console.log('Course found in My Courses list');
            joinSuccess = true;
          } catch (findError) {
            console.log('Course not found in My Courses list');
          }
        }
        
        if (joinSuccess) {
          console.log('TEST PASSED: Successfully joined course and verified enrollment');
        } else {
          throw new Error('Could not verify successful course enrollment through any method');
        }
        
      } else {
        throw new Error('No join buttons found on the page');
      }
    } catch (error) {
      console.error('Error in Step 1:', error.message);
      
      const pageSource = await driver.getPageSource();
      fs.writeFileSync('page_source_before_error.html', pageSource, 'utf8');
      console.log('Saved full page source to page_source_before_error.html');
      
      throw new Error('Failed to find or click join button: ' + error.message);
    }
    
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(`join_course_test_failure_${Date.now()}.png`, screenshot, 'base64');
      console.log('Screenshot saved for debugging');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
    }
    
    try {
      const pageSource = await driver.getPageSource();
      fs.writeFileSync(`join_course_failure_page_${Date.now()}.html`, pageSource, 'utf8');
      console.log('Page source saved for debugging');
    } catch (sourceError) {
      console.error('Failed to capture page source:', sourceError.message);
    }
    
  } finally {
    console.log('Closing browser...');
    await driver.quit();
  }
}

runJoinCourseTest().catch(error => {
  console.error('Test execution failed:', error.message);
});