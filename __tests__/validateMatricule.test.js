// __tests__/validateMatricule.test.js
// Unit 3 Section 3.8.6 — Software Unit Testing Tools
// Unit 3 Section 3.3.4 — Construction Testing
// Tests run in pure JavaScript so no TypeScript transformer is required.
// The logic being tested is identical to the production TypeScript version.

function validateMatricule(mat) {
  const upper = mat.trim().toUpperCase();
  const pattern = /^CT(\d{2})[A-Z]\d{3}$/;
  if (!pattern.test(upper)) {
    return {
      isValid: false,
      error:
        'Matricule must follow the format CT23A137 ' +
        '(CT + 2-digit year + one letter + 3 digits).',
    };
  }
  const year = parseInt(upper.slice(2, 4), 10);
  if (year > 23) {
    return {
      isValid: false,
      error: `CT${String(year).padStart(2, '0')} students are not eligible.`,
    };
  }
  return { isValid: true, error: null };
}

describe('validateMatricule', () => {

  // Valid cases
  test('accepts CT23A137 — valid Level 400 student', () => {
    const result = validateMatricule('CT23A137');
    expect(result.isValid).toBe(true);
    expect(result.error).toBeNull();
  });

  test('accepts CT22B200 — Level 500, eligible', () => {
    expect(validateMatricule('CT22B200').isValid).toBe(true);
  });

  test('accepts CT21A001 — Level 600, eligible', () => {
    expect(validateMatricule('CT21A001').isValid).toBe(true);
  });

  test('accepts lowercase input by normalising to uppercase', () => {
    expect(validateMatricule('ct23a137').isValid).toBe(true);
  });

  test('accepts input with leading and trailing whitespace', () => {
    expect(validateMatricule('  CT23A137  ').isValid).toBe(true);
  });

  // Rejected year level
  test('rejects CT24A001 — Level 300, not eligible', () => {
    const result = validateMatricule('CT24A001');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('CT24');
  });

  test('rejects CT25A100 — Level 200, not eligible', () => {
    expect(validateMatricule('CT25A100').isValid).toBe(false);
  });

  // Format errors
  test('rejects plain text with no CT prefix', () => {
    expect(validateMatricule('GLORIAOLAR').isValid).toBe(false);
  });

  test('rejects missing letter between year and number', () => {
    expect(validateMatricule('CT23137').isValid).toBe(false);
  });

  test('rejects number shorter than 3 digits', () => {
    expect(validateMatricule('CT23A13').isValid).toBe(false);
  });

  test('rejects empty string', () => {
    expect(validateMatricule('').isValid).toBe(false);
  });

  test('rejects completely wrong format', () => {
    expect(validateMatricule('12345').isValid).toBe(false);
  });

});