import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Convert any length key to exactly 32 bytes
function getKey(key) {
    // If key is shorter than 32 bytes, hash it to get 32 bytes
    if (!key || Buffer.from(key).length < 32) {
        return crypto.createHash('sha256').update(String(key)).digest();
    }
    // If key is longer than 32 bytes, take first 32 bytes
    return Buffer.from(key).slice(0, 32);
}

const ENCRYPTION_KEY = getKey(process.env.MESSAGE_ENCRYPTION_KEY);
const IV_LENGTH = 16; // For AES, this is always 16

function encrypt(text) {
    if (!text) return text;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Encryption error:', error);
        return text; // Return original text if encryption fails
    }
}

function decrypt(text) {
    if (!text || !text.includes(':')) return text;
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Decryption error:', error);
        return text; // Return original text if decryption fails
    }
}

export { encrypt, decrypt }; 