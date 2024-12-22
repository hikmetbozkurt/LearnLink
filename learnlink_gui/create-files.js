const fs = require("fs");
const path = require("path");

const files = [
  "src/features/chat/components/ChatWindow.tsx",
  "src/features/chat/components/MessageInput.tsx",
  "src/features/chat/components/MessageList.tsx",
  "src/features/chat/hooks/useChat.ts",
  "src/features/chat/services/chatService.ts",
  "src/features/chat/slices/chatSlice.ts",
  "src/features/chat/validations/chatValidation.ts",
  "src/features/chat/dtos/chatDTO.ts",
  "src/features/chat/ChatPage.tsx",
  "src/features/login/components/SignInPage.tsx",
  "src/features/login/components/SignUpPage.tsx",
  "src/features/login/components/ResetPasswordPage.tsx",
  "src/features/login/components/ForgetPasswordPage.tsx",
  "src/features/login/hooks/useAuth.ts",
  "src/features/login/services/authService.ts",
  "src/features/login/services/resetPasswordService.ts",
  "src/features/login/slices/loginSlice.ts",
  "src/features/login/validations/loginValidation.ts",
  "src/features/login/dtos/loginDTO.ts",
  "src/features/user/components/Profile.tsx",
  "src/features/user/components/EditProfile.tsx",
  "src/features/user/hooks/useUser.ts",
  "src/features/user/services/userService.ts",
  "src/features/user/slices/userSlice.ts",
  "src/features/user/validations/userValidation.ts",
  "src/features/user/dtos/userDTO.ts",
  "src/features/user/ProfilePage.tsx",
  "src/components/Button/Button.tsx",
  "src/components/Button/Button.module.css",
  "src/components/Modal/Modal.tsx",
  "src/components/Modal/Modal.module.css",
  "src/components/Navbar/Navbar.tsx",
  "src/components/Navbar/Navbar.module.css",
  "src/components/Sidebar/Sidebar.tsx",
  "src/components/Sidebar/Sidebar.module.css",
  "src/themes/lightTheme.ts",
  "src/themes/darkTheme.ts",
  "src/themes/themeProvider.tsx",
  "src/styles/global.css",
  "src/styles/variables.css",
  "src/hooks/useFetch.ts",
  "src/hooks/useTheme.ts",
  "src/api/apiConfig.ts",
  "src/store/store.ts",
  "src/utils/logger.ts",
  "src/utils/formatter.ts",
  "src/routes/AppRoutes.tsx",
  "src/locales/en/translation.json",
  "src/locales/tr/translation.json",
  "src/App.tsx",
  "src/index.tsx",
];

files.forEach((filePath) => {
  const fullPath = path.join(__dirname, filePath);
  const dirName = path.dirname(fullPath);

  // Klasörleri oluştur
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
    console.log(`Directory created: ${dirName}`);
  }

  // Dosyaları oluştur
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, "");
    console.log(`File created: ${fullPath}`);
  }
});

console.log("All files and directories have been created!");
