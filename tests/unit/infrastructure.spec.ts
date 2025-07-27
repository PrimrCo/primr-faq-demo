/**
 * Simple unit tests to verify testing infrastructure
 */

describe('Testing Infrastructure', () => {
  describe('Basic functionality', () => {
    it('should run basic tests', () => {
      expect(true).toBe(true);
    });

    it('should handle async operations', async () => {
      const result = await Promise.resolve('test');
      expect(result).toBe('test');
    });

    it('should work with numbers', () => {
      const sum = 2 + 2;
      expect(sum).toBe(4);
    });

    it('should work with strings', () => {
      const greeting = 'Hello, World!';
      expect(greeting).toContain('World');
    });

    it('should work with arrays', () => {
      const numbers = [1, 2, 3, 4, 5];
      expect(numbers).toHaveLength(5);
      expect(numbers).toContain(3);
    });
  });

  describe('Environment setup', () => {
    it('should have test environment variables set', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    it('should have access to console', () => {
      expect(console).toBeDefined();
      expect(console.log).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should catch thrown errors', () => {
      expect(() => {
        throw new Error('Test error');
      }).toThrow('Test error');
    });

    it('should handle rejected promises', async () => {
      await expect(Promise.reject(new Error('Async error'))).rejects.toThrow('Async error');
    });
  });
});