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
const TAGS_MIN_COUNT = 1;
const TAGS_MAX_COUNT = 10;

/**
 * Validate URL field
 */
export function validateUrl(url: string): ValidationError | null {
    if (!url || url.trim().length === 0) {
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
 */
export function validateMemo(memo: string, required: boolean = false): ValidationError | null {
    if (required && (!memo || memo.trim().length === 0)) {
        return { field: 'memo', message: 'メモは必須です' };
    }
    if (memo && memo.length > MEMO_MAX_LENGTH) {
        return { field: 'memo', message: `メモは${MEMO_MAX_LENGTH}文字以内で入力してください` };
    }
    return null;
}

/**
 * Validate Tags field
 */
export function validateTags(tags: string[], required: boolean = false): ValidationError | null {
    if (required && tags.length === 0) {
        return { field: 'tags', message: 'タグは1つ以上必要です' };
    }
    if (tags.length > 0 && tags.length < TAGS_MIN_COUNT) {
        return { field: 'tags', message: `タグは${TAGS_MIN_COUNT}個以上必要です` };
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
 * Validate bookmark for updating (memo and tags are required in UI for consistency)
 */
export function validateBookmarkForUpdate(memo: string, tags: string[]): ValidationResult {
    const errors: ValidationError[] = [];

    // Memo is required for update as well (UI consistency)
    const memoError = validateMemo(memo, true);
    if (memoError) errors.push(memoError);

    // Tags are required (OpenAPI spec: minItems: 1 when sending tags)
    const tagsError = validateTags(tags, true);
    if (tagsError) errors.push(tagsError);

    return {
        isValid: errors.length === 0,
        errors
    };
}
