/**
 * Bookmark validation utilities based on OpenAPI specification
 */

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

// Validation constants from OpenAPI spec
const URL_MAX_LENGTH = 400;
const MEMO_MAX_LENGTH = 400;
const TAG_MIN_LENGTH = 1;
const TAG_MAX_LENGTH = 100;
const TAGS_MAX_COUNT = 10;

/**
 * Parse tags from comma-separated string
 * Shared utility to ensure consistent tag parsing across UI and validation
 * Automatically removes duplicates
 */
export function parseTags(tagsInput: string): string[] {
    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    return Array.from(new Set(tags));
}

/**
 * Validate URL field
 * Note: Validates the raw input without trimming to match API behavior
 */
export function validateUrl(url: string): ValidationError | null {
    if (!url || url.length === 0) {
        return { field: 'url', message: 'URLは必須です' };
    }
    if (url.length > URL_MAX_LENGTH) {
        return { field: 'url', message: `URLは${URL_MAX_LENGTH}文字以内で入力してください` };
    }
    try {
        new URL(url);
    } catch {
        return { field: 'url', message: '有効なURL形式で入力してください' };
    }
    return null;
}

/**
 * Validate Memo field
 * Note: Uses trimmed value for emptiness check, raw length for max length check
 * to prevent whitespace-only submissions while allowing trailing spaces
 * 
 * Note regarding OpenAPI spec:
 * The spec lists memo as required/optional but doesn't specify minLength.
 * The client intentionally enforces stricter validation (non-empty/non-whitespace)
 * to ensure meaningful data is saved.
 */
export function validateMemo(memo: string, required: boolean = false): ValidationError | null {
    const trimmedMemo = memo.trim();
    if (required && trimmedMemo.length === 0) {
        return { field: 'memo', message: 'メモは必須です' };
    }
    if (memo.length > MEMO_MAX_LENGTH) {
        return { field: 'memo', message: `メモは${MEMO_MAX_LENGTH}文字以内で入力してください` };
    }
    return null;
}

/**
 * Validate Tags field
 */
export function validateTags(tags: string[], required: boolean = true): ValidationError | null {
    if (required && tags.length === 0) {
        return { field: 'tags', message: 'タグは1つ以上必要です' };
    }
    if (tags.length > TAGS_MAX_COUNT) {
        return { field: 'tags', message: `タグは${TAGS_MAX_COUNT}個以内にしてください` };
    }
    for (const tag of tags) {
        if (tag.length < TAG_MIN_LENGTH) {
            return { field: 'tags', message: '空のタグは使用できません' };
        }
        if (tag.length > TAG_MAX_LENGTH) {
            return { field: 'tags', message: `各タグは${TAG_MAX_LENGTH}文字以内で入力してください` };
        }
    }
    return null;
}

/**
 * Validate bookmark for adding (all fields required)
 */
export function validateBookmarkForAdd(url: string, memo: string, tags: string[]): ValidationResult {
    const errors: ValidationError[] = [];

    const urlError = validateUrl(url);
    if (urlError) errors.push(urlError);

    const memoError = validateMemo(memo, true);
    if (memoError) errors.push(memoError);

    const tagsError = validateTags(tags, true);
    if (tagsError) errors.push(tagsError);

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate bookmark for updating
 * 
 * Note: Although OpenAPI spec defines memo and tags as optional (anyOf with null),
 * the UI enforces them as required for better user experience:
 * - Prevents accidental data loss when editing
 * - Maintains consistency with the add form
 * - OpenAPI spec's minItems:1 for tags implies non-empty when submitted
 */
export function validateBookmarkForUpdate(memo: string, tags: string[]): ValidationResult {
    const errors: ValidationError[] = [];

    const memoError = validateMemo(memo, true);
    if (memoError) errors.push(memoError);

    const tagsError = validateTags(tags, true);
    if (tagsError) errors.push(tagsError);

    return {
        isValid: errors.length === 0,
        errors
    };
}
