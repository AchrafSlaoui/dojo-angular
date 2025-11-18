import { FormatValuePipe } from './format-value.pipe';

describe('FormatValuePipe', () => {
  let pipe: FormatValuePipe;

  beforeEach(() => {
    pipe = new FormatValuePipe();
  });

  it('formats text in uppercase when requested', () => {
    // Given a lowercase text value
    // When the pipe transforms the value with uppercase formatting
    const result = pipe.transform('alpha', 'text', true);
    // Then the output is uppercased
    expect(result).toBe('ALPHA');
  });

  it('formats french phone numbers with spaces', () => {
    // Given a French phone number without separators
    // When the pipe applies the phone formatter
    const result = pipe.transform('0612345678', 'phone');
    // Then the digits are grouped with spaces
    expect(result).toBe('06 12 34 56 78');
  });

  it('formats numbers as euro currency', () => {
    // Given a decimal numeric value
    // When the pipe formats it as currency with two decimals
    const result = pipe.transform(1234.5, 'currency', undefined, 2);
    // Then the output matches the euro format
    expect(result).toBe('1\u202F234,50 \u20AC');
  });

  it('returns the fallback when the value is empty', () => {
    // Given an empty string input
    // When the pipe transforms it with a fallback specified
    const result = pipe.transform('   ', undefined, undefined, undefined, 'N/A');
    // Then the fallback value is returned
    expect(result).toBe('N/A');
  });
});
