import crypto from 'crypto';
import logger from './logger.js';

const ENCRYPTION_ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.JWT_SECRET || 'default-secret-key')
  .digest();

export const encrypt = (text) => {
  if (!text) return null;
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    logger.error('Encryption error:', error);
    throw error;
  }
};

export const decrypt = (encryptedText) => {
  if (!encryptedText) return null;
  
  try {
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(parts[1], 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Decryption error:', error);
    throw error;
  }
};

export const hashSensitiveData = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

export const generateToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

export const maskPAN = (pan) => {
  if (!pan || pan.length < 8) return pan;
  return pan.substring(0, 4) + 'XXXX' + pan.substring(8);
};

export const maskAadhaar = (aadhaar) => {
  if (!aadhaar) return aadhaar;
  const cleaned = aadhaar.replace(/\s/g, '');
  return 'XXXX XXXX ' + cleaned.substring(8);
};

export const maskAccountNumber = (accountNumber) => {
  if (!accountNumber || accountNumber.length < 4) return accountNumber;
  return 'XXXX XXXX ' + accountNumber.substring(accountNumber.length - 4);
};
