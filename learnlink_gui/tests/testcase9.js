const { Builder, By, until } = require('selenium-webdriver');
const fs = require('fs');
const path = require('path');

/**
 * Test Case: LL-TC-009-File-Attachment (Course Post)
 * Test Priority: High
 * Module: Course Management
 * Description: Verify file attachment functionality in course post
 */
async function runFileAttachmentTest() {
  const driver = await new Builder().forBrowser('chrome').build();
  try {
    console.log('Starting LearnLink File Attachment Test (Course Post)');
    const testUrl = 'http://localhost:3000/';
    const testEmail = 'admin@admin.com';
    const testPassword = 'Admin123';
    const testFilePath = path.join(__dirname, 'test.docx');
    const courseName = 'Test Course'; // Hedef kursun adı

    // Step 1: Login
    await driver.get(testUrl);
    await driver.sleep(2000);
    const signInContainer = await driver.wait(until.elementLocated(By.css('.sign-in')), 10000);
    await signInContainer.findElement(By.css('input[type="email"]')).sendKeys(testEmail);
    await signInContainer.findElement(By.css('input[type="password"]')).sendKeys(testPassword);
    await signInContainer.findElement(By.css('button[type="submit"]')).click();
    await driver.wait(until.urlContains('/home'), 10000);
    await driver.sleep(2000);
    fs.writeFileSync('testcase9_ss/1_loggedin.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 1 PASS: Logged in');

    // Step 2: Go to Courses page
    await driver.get('http://localhost:3000/courses');
    await driver.wait(until.elementLocated(By.css('.courses-container')), 10000);
    await driver.sleep(2000);
    fs.writeFileSync('testcase9_ss/2_courses.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 2 PASS: Courses page loaded');

    // Step 3: Go to My Courses tab
    const myCoursesTab = await driver.findElement(By.xpath("//div[contains(@class, 'sidebar-item') and contains(., 'My Courses')]"));
    await myCoursesTab.click();
    await driver.sleep(1000);

    // Step 4: Select the course
    const courseItem = await driver.findElement(By.xpath(`//span[contains(@class, 'course-title') and text()='${courseName}']`));
    await courseItem.click();
    await driver.wait(until.elementLocated(By.css('.course-detail-container')), 10000);
    await driver.sleep(2000);
    fs.writeFileSync('testcase9_ss/3_course_selected.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 3 PASS: Course selected');

    // Step 5: Click Create Post
    const createPostBtn = await driver.findElement(By.css('.create-post-btn, .create-post-button'));
    await createPostBtn.click();
    await driver.wait(until.elementLocated(By.css('.modal-content.create-post-modal')), 5000);
    fs.writeFileSync('testcase9_ss/4_create_post_modal.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 4 PASS: Create Post modal opened');

    // Step 6: Attach file
    const fileInput = await driver.findElement(By.css('input[type="file"]'));
    await fileInput.sendKeys(testFilePath);
    await driver.sleep(1000);
    fs.writeFileSync('testcase9_ss/5_file_attached.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 5 PASS: File attached');

    // Step 7: Write post and submit
    const textarea = await driver.wait(
      until.elementLocated(By.css('textarea[placeholder="Share your thoughts, questions, or resources..."]')),
      5000
    );
    await driver.wait(until.elementIsVisible(textarea), 5000);
    await textarea.sendKeys('TEST TEST');
    const postBtn = await driver.findElement(By.css('.submit-button'));
    await postBtn.click();
    await driver.sleep(2000);
    fs.writeFileSync('testcase9_ss/6_post_submitted.png', await driver.takeScreenshot(), 'base64');
    console.log('Step 6 PASS: Post submitted');

    // Step 8: Verify post with file appears
    await driver.wait(until.elementLocated(By.css('.post-card')), 10000);
    const posts = await driver.findElements(By.css('.post-card'));
    let found = false;
    for (let post of posts) {
      const content = await post.getText();
      if (content.includes('TEST TEST') && content.includes('test.docx')) {
        found = true;
        break;
      }
    }
    if (found) {
      console.log('Step 7 PASS: Post with file appears');
      fs.writeFileSync('testcase9_ss/7_post_verified.png', await driver.takeScreenshot(), 'base64');
      console.log('TEST PASSED: File attachment in course post works');
    } else {
      throw new Error('Post with file not found');
    }
  } catch (error) {
    console.error('TEST FAILED:', error.message);
    try {
      fs.writeFileSync(`testcase9_ss/failure_${Date.now()}.png`, await driver.takeScreenshot(), 'base64');
    } catch {}
  } finally {
    await driver.quit();
  }
}

runFileAttachmentTest().catch(e => console.error('Test execution failed:', e.message)); 