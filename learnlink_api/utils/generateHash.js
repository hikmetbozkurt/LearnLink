import bcrypt from 'bcryptjs';

const password = 'password123';

// Generate hash
bcrypt.hash(password, 10).then(hash => {
    console.log('Password:', password);
    console.log('Hash:', hash);
}); 