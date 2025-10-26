import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { processNaturalLanguageCommand, generateEmailContent, summarizeEmails } from '../gemini';

describe('Gemini Service Tests', () => {
    describe('processNaturalLanguageCommand', () => {
        test('should handle API errors gracefully', async () => {
            const result = await processNaturalLanguageCommand('test command', 'en');

            expect(result).toBeDefined();
            expect(result).toHaveProperty('intent');
            expect(result).toHaveProperty('response');
            expect(result).toHaveProperty('language');
        });

        test('should return error intent when API fails', async () => {
            const result = await processNaturalLanguageCommand('invalid', 'en');

            // Should return error response, not throw
            expect(result.intent.action).toBeDefined();
            expect(result.response).toBeDefined();
        });

        test('should support multiple languages', async () => {
            const languages = ['en', 'ur', 'roman-ur'];

            for (const lang of languages) {
                const result = await processNaturalLanguageCommand('hello', lang);
                expect(result.language).toBe(lang);
            }
        });

        test('should not throw unhandled errors', async () => {
            await expect(
                processNaturalLanguageCommand('test', 'en')
            ).resolves.not.toThrow();
        });
    });

    describe('generateEmailContent', () => {
        test('should handle API errors gracefully', async () => {
            const result = await generateEmailContent(
                'Test Subject',
                'Test Context',
                'en'
            );

            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should return error message in correct language', async () => {
            const resultEn = await generateEmailContent('', '', 'en');
            expect(resultEn).toContain('Could not generate');
        });
    });

    describe('summarizeEmails', () => {
        test('should handle empty email list', async () => {
            const result = await summarizeEmails([], 'en');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });

        test('should handle API errors gracefully', async () => {
            const emails = [
                { subject: 'Test', content: 'Test content', sender: 'test@test.com' }
            ];

            const result = await summarizeEmails(emails, 'en');
            expect(result).toBeDefined();
            expect(typeof result).toBe('string');
        });
    });
});
