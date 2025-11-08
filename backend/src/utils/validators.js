import Joi from 'joi';

export const validateEmail = (email) => {
  const schema = Joi.string().email().required();
  return schema.validate(email);
};

export const validatePassword = (password) => {
  const schema = Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, number and special character'
    });
  return schema.validate(password);
};

export const validatePAN = (pan) => {
  const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panPattern.test(pan);
};

export const validateAadhaar = (aadhaar) => {
  return aadhaar.replace(/\s/g, '').length === 12 && /^\d+$/.test(aadhaar.replace(/\s/g, ''));
};

export const validateIFSC = (ifsc) => {
  const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscPattern.test(ifsc);
};

export const validateAccountNumber = (accountNumber) => {
  return accountNumber.length >= 9 && accountNumber.length <= 18 && /^\d+$/.test(accountNumber);
};

export const validatePhoneNumber = (phone) => {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));
};

export const validateDateOfBirth = (dob) => {
  const date = new Date(dob);
  const age = (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000 * 365.25);
  return age >= 18 && age <= 65;
};

export const onboardingValidationSchema = Joi.object({
  candidate_email: Joi.string().email().required(),
  candidate_name: Joi.string().min(2).max(100).required(),
  department: Joi.string().required(),
  position: Joi.string().required(),
  joining_date: Joi.date().required()
});

export const personalInfoValidationSchema = Joi.object({
  full_name: Joi.string().min(2).max(100).required(),
  dob: Joi.date().required(),
  contact_number: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
  address: Joi.string().min(5).max(255).required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().pattern(/^\d{6}$/).required()
});

export const bankInfoValidationSchema = Joi.object({
  bank_name: Joi.string().required(),
  account_number: Joi.string().required(),
  ifsc_code: Joi.string().pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/).required(),
  account_holder_name: Joi.string().required()
});

export const onboardingSubmitValidationSchema = Joi.object({
  pan: Joi.string().pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).required(),
  aadhaar: Joi.string().required(),
  pan_verified: Joi.boolean().required(),
  aadhaar_verified: Joi.boolean().required()
});
