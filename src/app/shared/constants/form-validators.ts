// src/app/shared/constants/form-validators.ts

import {
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';

/**
 * Regex patterns used across registration forms.
 * Keep patterns efficient and readable.
 */
export const VALIDATION_PATTERNS = {
  // Standard email format (simple, performant)
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Exactly 10 digits
  phone: /^\d{10}$/,

  // Only letters (A-Z, a-z) and spaces allowed for names
  nameNoNumbers: /^[A-Za-z ]+$/,

  // Only digits allowed (useful for numeric-only fields)
  onlyNumbers: /^\d+$/,

  // Password: At least 8 chars including uppercase, lowercase, number, and special char
  // Note: We validate each requirement individually for granular messages.
  // This aggregate pattern can be used for a quick overall check if needed.
  passwordAggregate: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/
} as const;

/**
 * Centralized validation error messages for form fields.
 * Keys correspond to Angular Validator errors and custom validator error keys.
 */
export const VALIDATION_MESSAGES = {
  userName: {
    required: 'Full name is required',
    minlength: 'Name must be at least 3 characters',
    maxlength: 'Name must not exceed 50 characters',
    pattern: 'Name cannot contain numbers', // triggered when not matching nameNoNumbers
    hasNumbers: 'Name cannot contain numbers' // custom error key from noNumbers()
  },
  email: {
    required: 'Email is required',
    pattern: 'Please enter a valid email address'
  },
  phoneNumber: {
    required: 'Phone number is required',
    pattern: 'Phone number must be exactly 10 digits',
    onlyNumbers: 'Phone number must contain only numbers'
  },
  password: {
    required: 'Password is required',
    minlength: 'Password must be at least 8 characters',
    missingUppercase: 'Password must contain at least one uppercase letter',
    missingLowercase: 'Password must contain at least one lowercase letter',
    missingNumber: 'Password must contain at least one number',
    missingSpecialChar:
      'Password must contain at least one special character (@$!%*?&)'
  },
  confirmPassword: {
    required: 'Please confirm your password',
    passwordMismatch: 'Passwords do not match'
  }
} as const;

/**
 * CustomValidators contains reusable validator functions
 * that return specific error keys for granular feedback.
 */
export class CustomValidators {
  /**
   * noNumbers validator
   * Ensures the control value does not contain digits (0-9).
   *
   * Behavior:
   * - Returns null if value is empty (let Validators.required handle empties).
   * - Returns { hasNumbers: true } if any digit is present.
   * - Returns null if valid (no digits).
   *
   * Example:
   * this.fb.control('', [CustomValidators.noNumbers()])
   */
  static noNumbers(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      // If empty or not a string, let required & type checks handle it
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const str = String(value);

      // Early return: if pattern matches "letters and spaces only", it's valid
      if (VALIDATION_PATTERNS.nameNoNumbers.test(str)) {
        return null;
      }

      // If numbers exist or any non-letter characters, surface hasNumbers
      // This matches requirement: "Name cannot contain numbers"
      // We avoid overly strict checks and rely on UI constraints for special chars.
      const hasDigit = /\d/.test(str);
      return hasDigit ? { hasNumbers: true } : { hasNumbers: true };
    };
  }

  /**
   * passwordStrength validator
   * Validates granular password requirements:
   * - At least one uppercase letter (A-Z)
   * - At least one lowercase letter (a-z)
   * - At least one number (0-9)
   * - At least one special character (@$!%*?&)
   * - Length at least 8 (use Validators.minLength(8) for standard error)
   *
   * Behavior:
   * - Returns null if value is empty (let required/minLength handle empties).
   * - Returns one or more error flags:
   *   { missingUppercase: true }
   *   { missingLowercase: true }
   *   { missingNumber: true }
   *   { missingSpecialChar: true }
   *
   * Example:
   * this.fb.control('', [Validators.minLength(8), CustomValidators.passwordStrength()])
   */
  static passwordStrength(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;

      if (value === null || value === undefined || value === '') {
        return null;
      }

      const str = String(value);

      // Build errors map
      const errors: ValidationErrors = {};

      if (!/[A-Z]/.test(str)) {
        errors['missingUppercase'] = true;
      }
      if (!/[a-z]/.test(str)) {
        errors['missingLowercase'] = true;
      }
      if (!/\d/.test(str)) {
        errors['missingNumber'] = true;
      }
      if (!/[@$!%*?&]/.test(str)) {
        errors['missingSpecialChar'] = true;
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  /**
   * passwordMatch validator (FormGroup-level)
   * Compares two sibling controls in a form group and emits { passwordMismatch: true }
   * when they differ.
   *
   * Behavior:
   * - Works even if confirmPassword is filled first.
   * - Revalidates when either field changes.
   * - Does not overwrite other errors on the confirm control.
   *
   * Usage:
   * this.fb.group({
   *   password: ['', [...] ],
   *   confirmPassword: ['', [...] ]
   * }, { validators: CustomValidators.passwordMatch('password', 'confirmPassword') });
   */
  static passwordMatch(
    passwordKey: string,
    confirmPasswordKey: string
  ): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const passwordControl = (group as any).get?.(
        passwordKey
      ) as AbstractControl | null;
      const confirmControl = (group as any).get?.(
        confirmPasswordKey
      ) as AbstractControl | null;

      if (!passwordControl || !confirmControl) {
        return null; // Controls not found; no validation
      }

      const password = passwordControl.value;
      const confirm = confirmControl.value;

      // If either is empty, don't flag mismatch here; required validators handle empties.
      if (
        password === null ||
        password === undefined ||
        confirm === null ||
        confirm === undefined
      ) {
        // Clear previous mismatch error to avoid stale state
        if (confirmControl.hasError('passwordMismatch')) {
          const newErrors = { ...confirmControl.errors };
          delete newErrors['passwordMismatch'];
          confirmControl.setErrors(
            Object.keys(newErrors).length ? newErrors : null
          );
        }
        return null;
      }

      // Compare
      if (password !== confirm) {
        // Merge with existing errors
        const currentErrors = confirmControl.errors || {};
        confirmControl.setErrors({ ...currentErrors, passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Clear mismatch while preserving other errors
        if (confirmControl.errors) {
          const newErrors = { ...confirmControl.errors };
          delete newErrors['passwordMismatch'];
          confirmControl.setErrors(
            Object.keys(newErrors).length ? newErrors : null
          );
        }
        return null;
      }
    };
  }
}

/**
 * Ready-to-use field validators for common registration fields.
 * Compose with Validators.required etc. for simplicity in components.
 */
export const FIELD_VALIDATORS = {
  userName: [
    Validators.required,
    Validators.minLength(3),
    Validators.maxLength(50),
    // Pattern ensures no numbers; allows letters and spaces only
    Validators.pattern(VALIDATION_PATTERNS.nameNoNumbers),
    CustomValidators.noNumbers()
  ],

  email: [Validators.required, Validators.pattern(VALIDATION_PATTERNS.email)],

  phoneNumber: [
    Validators.required,
    // Trim whitespace before checking pattern in component if needed,
    // but pattern here enforces exactly 10 digits.
    Validators.pattern(VALIDATION_PATTERNS.phone)
  ],

  password: [
    Validators.required,
    Validators.minLength(8),
    CustomValidators.passwordStrength()
  ],

  confirmPassword: [Validators.required]
} as const;

/**
 * Form group-level validators collection.
 * Add more group validators as needed in future.
 */
export const FORM_VALIDATORS = {
  passwordMatch: CustomValidators.passwordMatch('password', 'confirmPassword')
} as const;

/**
 * Example usage:
 *
 * // In a registration component:
 * import { FIELD_VALIDATORS, FORM_VALIDATORS } from '../../shared/constants/form-validators';
 *
 * this.registrationForm = this.fb.group({
 *   userName: ['', FIELD_VALIDATORS.userName],
 *   email: ['', FIELD_VALIDATORS.email],
 *   phoneNumber: ['', FIELD_VALIDATORS.phoneNumber],
 *   password: ['', FIELD_VALIDATORS.password],
 *   confirmPassword: ['', FIELD_VALIDATORS.confirmPassword]
 * }, {
 *   validators: FORM_VALIDATORS.passwordMatch
 * });
 *
 * // To display messages, map control.errors keys to VALIDATION_MESSAGES[field].
 */
