import { describe, it, expect } from 'vitest';
import {
    validateUrl,
    validateMemo,
    validateTags,
    validateBookmarkForAdd,
    validateBookmarkForUpdate,
    parseTags
} from '../src/utils/validation';

describe('validateUrl', () => {
    it('returns error for empty URL', () => {
        expect(validateUrl('')).toEqual({ field: 'url', message: 'URLは必須です' });
    });

    it('returns error for whitespace-only URL', () => {
        // URL validation no longer trims - whitespace-only becomes invalid URL format
        expect(validateUrl('   ')).toEqual({ field: 'url', message: '有効なURL形式で入力してください' });
    });

    it('returns error for URL exceeding max length', () => {
        const longUrl = 'https://example.com/' + 'a'.repeat(400);
        const error = validateUrl(longUrl);
        expect(error).not.toBeNull();
        expect(error?.field).toBe('url');
    });

    it('returns error for invalid URL format', () => {
        expect(validateUrl('not-a-url')).toEqual({ field: 'url', message: '有効なURL形式で入力してください' });
        expect(validateUrl('example.com')).toEqual({ field: 'url', message: '有効なURL形式で入力してください' });
    });

    it('returns null for valid URL', () => {
        expect(validateUrl('https://example.com')).toBeNull();
        expect(validateUrl('http://localhost:3000')).toBeNull();
    });
});

describe('validateMemo', () => {
    it('returns error for empty memo when required', () => {
        expect(validateMemo('', true)).toEqual({ field: 'memo', message: 'メモは必須です' });
    });

    it('returns error for whitespace-only memo when required', () => {
        expect(validateMemo('   ', true)).toEqual({ field: 'memo', message: 'メモは必須です' });
    });

    it('returns null for empty memo when not required', () => {
        expect(validateMemo('', false)).toBeNull();
    });

    it('returns error for memo exceeding max length', () => {
        const longMemo = 'a'.repeat(401);
        const error = validateMemo(longMemo);
        expect(error).not.toBeNull();
        expect(error?.field).toBe('memo');
    });

    it('returns null for valid memo', () => {
        expect(validateMemo('Valid memo')).toBeNull();
        expect(validateMemo('a'.repeat(400))).toBeNull();
    });
});

describe('validateTags', () => {
    it('returns error for empty tags when required', () => {
        expect(validateTags([], true)).toEqual({ field: 'tags', message: 'タグは1つ以上必要です' });
    });

    it('returns null for empty tags when not required', () => {
        expect(validateTags([], false)).toBeNull();
    });

    it('returns error for more than 10 tags', () => {
        const tags = Array(11).fill('tag');
        const error = validateTags(tags);
        expect(error).not.toBeNull();
        expect(error?.field).toBe('tags');
    });

    it('returns error for empty tag', () => {
        expect(validateTags(['valid', ''])).toEqual({ field: 'tags', message: '空のタグは使用できません' });
    });

    it('returns error for tag exceeding max length', () => {
        const longTag = 'a'.repeat(101);
        const error = validateTags([longTag]);
        expect(error).not.toBeNull();
        expect(error?.field).toBe('tags');
    });

    it('returns null for valid tags', () => {
        expect(validateTags(['tech', 'news'])).toBeNull();
        expect(validateTags([...Array(10)].map((_, i) => `tag${i}`))).toBeNull();
    });
});

describe('validateBookmarkForAdd', () => {
    it('returns errors for all empty fields', () => {
        const result = validateBookmarkForAdd('', '', []);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(3);
    });

    it('returns valid for all valid fields', () => {
        const result = validateBookmarkForAdd('https://example.com', 'Test memo', ['tag1']);
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
});

describe('validateBookmarkForUpdate', () => {
    it('returns errors for empty fields (now required)', () => {
        const result = validateBookmarkForUpdate('', []);
        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
    });

    it('returns valid for all valid fields', () => {
        const result = validateBookmarkForUpdate('Valid memo', ['tag1']);
        expect(result.isValid).toBe(true);
    });

    it('returns error for memo exceeding max length', () => {
        const result = validateBookmarkForUpdate('a'.repeat(401), ['tag1']);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('memo');
    });

    it('validates tags are required', () => {
        const result = validateBookmarkForUpdate('memo', []);
        expect(result.isValid).toBe(false);
        expect(result.errors[0].field).toBe('tags');
    });
});

describe('parseTags', () => {
    it('parses comma separated string correctly', () => {
        expect(parseTags('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('trims whitespace', () => {
        expect(parseTags(' a , b , c ')).toEqual(['a', 'b', 'c']);
    });

    it('ignores empty items', () => {
        expect(parseTags('a,,b, ,c')).toEqual(['a', 'b', 'c']);
        expect(parseTags(',,')).toEqual([]);
    });

    it('handles empty input', () => {
        expect(parseTags('')).toEqual([]);
        expect(parseTags('   ')).toEqual([]);
    });
});
