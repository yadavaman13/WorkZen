import Tesseract from 'tesseract.js';
import logger from './logger.js';

export const extractTextFromImage = async (imagePath) => {
  try {
    logger.info(`Starting OCR extraction for: ${imagePath}`);
    
    const result = await Tesseract.recognize(
      imagePath,
      process.env.TESSERACT_LANG || 'eng',
      {
        logger: (m) => logger.debug('Tesseract progress:', m)
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence
    };
  } catch (error) {
    logger.error('OCR extraction failed:', error);
    throw new Error(`OCR extraction failed: ${error.message}`);
  }
};

export const extractPAN = (text) => {
  const panPattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/g;
  const matches = text.match(panPattern);
  return matches ? matches[0] : null;
};

export const extractAadhaar = (text) => {
  const aadhaarPattern = /\d{4}\s?\d{4}\s?\d{4}/g;
  const matches = text.match(aadhaarPattern);
  return matches ? matches[0].replace(/\s/g, '') : null;
};

export const extractName = (text) => {
  const lines = text.split('\n');
  return lines.slice(0, 3).join(' ').trim();
};

export const extractDateOfBirth = (text) => {
  const dobPattern = /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/;
  const matches = text.match(dobPattern);
  return matches ? matches[0] : null;
};

export const extractContactNumber = (text) => {
  const phonePattern = /[6-9]\d{9}/;
  const matches = text.match(phonePattern);
  return matches ? matches[0] : null;
};

export const parseDocumentData = async (imagePath, documentType) => {
  try {
    const { text, confidence } = await extractTextFromImage(imagePath);
    
    const extracted = {
      confidence,
      raw_text: text
    };

    switch (documentType.toLowerCase()) {
      case 'pan':
        extracted.pan = extractPAN(text);
        break;
      case 'aadhaar':
        extracted.aadhaar = extractAadhaar(text);
        extracted.name = extractName(text);
        extracted.dob = extractDateOfBirth(text);
        break;
      case 'resume':
        extracted.name = extractName(text);
        extracted.contact = extractContactNumber(text);
        break;
      case 'address_proof':
        extracted.address = text.split('\n').slice(0, 5).join(' ');
        break;
    }

    logger.info(`OCR extraction completed for ${documentType}:`, extracted);
    return extracted;
  } catch (error) {
    logger.error(`Error parsing ${documentType}:`, error);
    throw error;
  }
};
