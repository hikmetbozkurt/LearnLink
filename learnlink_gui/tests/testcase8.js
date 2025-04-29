const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

async function testNotificationDropdownVisible() {
  const options = new chrome.Options();
  options.addArguments('--start-maximized');
  options.addArguments('--disable-blink-features=AutomationControlled');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  try {
    console.log('Test: Notification Dropdown görünür mü?');

    await driver.get('http://localhost:3000');
    await driver.sleep(1500);

    // Giriş yap
    await driver.findElement(By.css('input[type="email"]')).sendKeys('admin@admin.com');
    await driver.findElement(By.css('input[type="password"]')).sendKeys('Admin123');
    await driver.findElement(By.css('button[type="submit"]')).click();

    // Şimdi sadece URL değil, hem URL hem DOM elementi bekle
    await driver.wait(until.urlContains('/home'), 10000);
    console.log('✅ /home URL açıldı');

    // Bildirim ikonunun DOM'a eklenmesini bekle
    const bell = await driver.wait(
      until.elementLocated(By.css('button.notification-bell')),
      15000 // 15 saniyeye kadar bekleyebilirsin
    );
    console.log('✅ Notification Bell DOMa geldi');

    // İkon aktif mi gerçekten kontrol et
    await driver.wait(until.elementIsVisible(bell), 10000);
    console.log('✅ Notification Bell görünür durumda');

    await bell.click();
    console.log('🔔 Notification Bell tıklandı');

    // Dropdown açıldı mı?
    const dropdown = await driver.wait(
      until.elementLocated(By.css('.notification-dropdown')),
      5000
    );

    const isVisible = await dropdown.isDisplayed();
    if (!isVisible) {
      throw new Error('Dropdown görünmedi');
    }

    console.log('✅ Dropdown başarıyla açıldı');

    // Bildirim listesi var mı?
    await driver.sleep(1000);
    const notificationItems = await driver.findElements(By.css('.notification-item'));
    console.log(`🔵 Notification item sayısı: ${notificationItems.length}`);

    // Ekran görüntüsü al
    const screenshot = await driver.takeScreenshot();
    fs.writeFileSync('notification_dropdown_success.png', screenshot, 'base64');
    console.log('📸 Screenshot kaydedildi: notification_dropdown_success.png');

    console.log('🎯 TEST BAŞARILI');

  } catch (error) {
    console.error('❌ TEST BAŞARISIZ:', error.message);
    const errorScreenshot = await driver.takeScreenshot();
    fs.writeFileSync('notification_dropdown_error.png', errorScreenshot, 'base64');
  } finally {
    await driver.sleep(4000);
    await driver.quit();
  }
}

testNotificationDropdownVisible();