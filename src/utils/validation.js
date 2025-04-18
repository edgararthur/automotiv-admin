// Email validation regex
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password validation - at least 8 chars, one uppercase, one lowercase, one number
export const isValidPassword = (password) => {
  if (password.length < 8) return false;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  return hasUpperCase && hasLowerCase && hasNumber;
};

// Phone number validation
export const isValidPhone = (phone) => {
  // Allows formats like: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
  return phoneRegex.test(phone);
};

// Check if string is empty or just whitespace
export const isEmptyString = (str) => {
  return !str || str.trim() === '';
};

// Validate ZIP/Postal code
export const isValidZip = (zip) => {
  // US ZIP: 5 digits or 5+4
  const usZipRegex = /(^\d{5}$)|(^\d{5}-\d{4}$)/;
  // Canadian postal code: A1A 1A1
  const canadianPostalRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
  // Ghana postal code: GA-123-4567
  const ghanaPostalRegex = /^[A-Z]{2}-\d{3}-\d{4}$/;
  
  return usZipRegex.test(zip) || canadianPostalRegex.test(zip) || ghanaPostalRegex.test(zip);
};

// Validate name (no numbers or special characters)
export const isValidName = (name) => {
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  return nameRegex.test(name);
};

// Get form validation errors as an object
export const getFormErrors = (formData, validationRules) => {
  const errors = {};
  
  Object.keys(validationRules).forEach(field => {
    const rules = validationRules[field];
    
    if (rules.required && isEmptyString(formData[field])) {
      errors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} is required`;
      return;
    }
    
    if (rules.minLength && formData[field].length < rules.minLength) {
      errors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} must be at least ${rules.minLength} characters`;
      return;
    }
    
    if (rules.email && !isValidEmail(formData[field])) {
      errors[field] = 'Please enter a valid email address';
      return;
    }
    
    if (rules.password && !isValidPassword(formData[field])) {
      errors[field] = 'Password must be at least 8 characters with uppercase, lowercase, and a number';
      return;
    }
    
    if (rules.phone && !isValidPhone(formData[field])) {
      errors[field] = 'Please enter a valid phone number';
      return;
    }
    
    if (rules.match && formData[field] !== formData[rules.match]) {
      errors[field] = `${field.replace(/([A-Z])/g, ' $1').trim()} does not match`;
      return;
    }
  });
  
  return errors;
}; 