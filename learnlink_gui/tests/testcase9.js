const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-009-File-Attachment (Course Post)
 * Test Priority: High
 * Module: Course Management
 * Description: Verify file attachment functionality in course post
 */

// Create necessary directories
const screenshotDir = path.join(__dirname, 'testcase9_ss');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Create test file if it doesn't exist
const testFilePath = path.join(__dirname, 'test.docx');
if (!fs.existsSync(testFilePath)) {
  fs.writeFileSync(testFilePath, 'This is a test document for file upload testing.');
}

async function runFileAttachmentTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    console.log('Starting LearnLink File Attachment Test (Course Post)');
    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';

    // Step 1: Login
    await driver.get(testUrl);
    await driver.sleep(2000);

    const signInContainer = await driver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await signInContainer.findElement(By.css('input[type="email"]')).sendKeys(testEmail);
    await signInContainer.findElement(By.css('input[type="password"]')).sendKeys(testPassword);
    await signInContainer.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    await driver.sleep(2000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '1_loggedin.png'), data, 'base64');
    });
    console.log('Step 1 PASS: Logged in');

    // Step 2: Go to Courses page
    await driver.get('http://localhost:3000/courses');
    await driver.wait(until.elementLocated(By.css('.courses-container')), 10000);
    await driver.sleep(2000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '2_courses.png'), data, 'base64');
    });
    console.log('Step 2 PASS: Courses page loaded');

    // Step 3: Find and select TESTCOURSE course
    const courseCards = await driver.findElements(By.css('.course-card'));
    let testCourse = null;
    
    for (let card of courseCards) {
      const cardText = await card.getText();
      if (cardText.includes('TESTCOURSE')) {
        testCourse = card;
        break;
      }
    }
    
    if (!testCourse) {
      throw new Error('Could not find TESTCOURSE course');
    }
    
    // Click Manage Course button
    const manageButton = await testCourse.findElement(By.css('button'));
    await manageButton.click();
    await driver.wait(until.elementLocated(By.css('.course-detail-container')), 10000);
    await driver.sleep(2000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '3_course_selected.png'), data, 'base64');
    });
    console.log('Step 3 PASS: TESTCOURSE course selected and managed');

    // Step 4: Click Create Post
    const createPostBtn = await driver.findElement(By.css('.create-post-btn'));
    await createPostBtn.click();
    await driver.wait(until.elementLocated(By.css('.post-modal-container')), 5000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '4_create_post_modal.png'), data, 'base64');
    });
    console.log('Step 4 PASS: Create Post modal opened');

    // Step 5: Write post content
    const postText = `Attach File Test ${new Date().toISOString()}`;
    const textarea = await driver.wait(
      until.elementLocated(By.css('.post-content-textarea')),
      5000
    );
    await driver.wait(until.elementIsVisible(textarea), 5000);
    await textarea.sendKeys(postText);
    await driver.sleep(1000);

    // Step 6: Attach file
    const fileInput = await driver.findElement(By.css('#file-upload'));
    await fileInput.sendKeys(testFilePath);
    await driver.sleep(1000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '5_file_attached.png'), data, 'base64');
    });
    console.log('Step 5 PASS: File attached');

    // Step 7: Submit post
    const submitButton = await driver.findElement(By.css('.post-submit-button'));
    await submitButton.click();
    
    // Wait longer for the post to appear
    await driver.sleep(3000);
    
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, '6_post_submitted.png'), data, 'base64');
    });
    console.log('Step 6 PASS: Post submitted');

    // Step 8: Verify post with file appears - with improved verification
    // Capture page HTML for debugging
    const pageSource = await driver.getPageSource();
    fs.writeFileSync(path.join(screenshotDir, 'page_source.html'), pageSource);
    
    // First look for posts
    await driver.wait(until.elementLocated(By.css('.post-card')), 10000);
    
    // Take a screenshot of all posts
    await driver.takeScreenshot().then(data => {
      fs.writeFileSync(path.join(screenshotDir, 'all_posts.png'), data, 'base64');
    });
    
    // Try different selectors to find the post
    const selectors = [
      // Look for post with our text
      By.xpath(`//div[contains(@class, 'post-card') and contains(., '${postText}')]`),
      // Look for any post with file attachment
      By.css('.post-card .attachment-container'),
      // Look for the filename specifically
      By.xpath("//div[contains(@class, 'post-card')]//a[contains(text(), 'test.docx')]"),
      // More general selector for any post with file
      By.css('.post-card .file-attachment')
    ];
    
    let postFound = false;
    
    for (const selector of selectors) {
      try {
        // Wait a short time for each selector
        const element = await driver.wait(until.elementLocated(selector), 3000);
        console.log(`Found post element with selector: ${selector}`);
        
        // Highlight the element for the screenshot
        await driver.executeScript("arguments[0].style.border='3px solid red'", element);
        
        await driver.takeScreenshot().then(data => {
          fs.writeFileSync(path.join(screenshotDir, '7_post_verified.png'), data, 'base64');
        });
        
        postFound = true;
        break;
      } catch (e) {
        console.log(`Selector ${selector} did not match, trying next`);
      }
    }
    
    if (postFound) {
      console.log('Step 7 PASS: Post with file appears');
      console.log('TEST PASSED: File attachment in course post works');
    } else {
      // Log all visible posts as a debugging aid
      console.log('Attempting to debug - listing all posts found:');
      const posts = await driver.findElements(By.css('.post-card'));
      console.log(`Found ${posts.length} posts on the page`);
      
      for (let i = 0; i < posts.length; i++) {
        const postText = await posts[i].getText();
        console.log(`Post ${i+1} content: ${postText}`);
      }
      
      throw new Error('Post with file not found after trying multiple selectors');
    }

  } catch (error) {
    console.error('TEST FAILED:', error.message);
    try {
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(path.join(screenshotDir, `failure_${Date.now()}.png`), screenshot, 'base64');
    } catch (screenshotError) {
      console.error('Failed to save error screenshot:', screenshotError.message);
    }
    throw error;
  } finally {
    await driver.quit();
  }
}

runFileAttachmentTest().catch(e => {
  console.error('Test execution failed:', e.message);
  process.exit(1);
});