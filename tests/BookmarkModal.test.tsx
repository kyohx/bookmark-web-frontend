import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookmarkModal } from '../src/components/BookmarkModal';

describe('BookmarkModal', () => {
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn();

    it('renders nothing when closed', () => {
        render(
            <BookmarkModal
                isOpen={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        expect(screen.queryByText('Add Bookmark')).not.toBeInTheDocument();
    });

    it('renders add form when open', () => {
        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        expect(screen.getByText('Add Bookmark')).toBeInTheDocument();
        expect(screen.getByLabelText(/^URL/)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Memo/)).toBeInTheDocument();
        expect(screen.getByLabelText(/^Tags/)).toBeInTheDocument();
    });

    it('pre-fills form with initial data and sorts tags', () => {
        const initialData = {
            hashed_id: '1',
            url: 'https://example.com',
            memo: 'Test Memo',
            tags: ['b', 'a', 'c'],
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        };

        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
                initialData={initialData}
            />
        );

        expect(screen.getByText('Edit Bookmark')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test Memo')).toBeInTheDocument();
        // Tags should be sorted: a, b, c
        expect(screen.getByDisplayValue('a, b, c')).toBeInTheDocument();
    });

    it('disables URL input when editing', () => {
        const initialData = {
            hashed_id: '1',
            url: 'https://example.com',
            memo: 'Test Memo',
            tags: ['tag'],
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        };

        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
                initialData={initialData}
            />
        );

        expect(screen.getByLabelText(/^URL/)).toBeDisabled();
    });

    it('submits form with correct data', async () => {
        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        const urlInput = screen.getByLabelText(/^URL/);
        const memoInput = screen.getByLabelText(/^Memo/);
        const tagsInput = screen.getByLabelText(/^Tags/);

        fireEvent.change(urlInput, { target: { value: 'https://new.com' } });
        fireEvent.change(memoInput, { target: { value: 'New Memo' } });
        fireEvent.change(tagsInput, { target: { value: 'tag1, tag2' } });

        const saveButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith('https://new.com', 'New Memo', ['tag1', 'tag2']);
        });
    });

    it('shows and clears validation errors', async () => {
        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        // Submit empty form
        const saveButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveButton);

        // Check for error messages
        expect(screen.getByText('入力エラーがあります')).toBeInTheDocument();
        expect(screen.getAllByText('URLは必須です').length).toBeGreaterThanOrEqual(2); // Banner list and Field inline

        // Check ARIA attributes
        const urlInput = screen.getByLabelText(/^URL/);
        const memoInput = screen.getByLabelText(/^Memo/);

        expect(urlInput).toHaveAttribute('aria-invalid', 'true');
        expect(urlInput).toHaveAttribute('aria-describedby', 'error-url');
        expect(memoInput).toHaveAttribute('aria-invalid', 'true');

        // Type in URL to clear error
        fireEvent.change(urlInput, { target: { value: 'https://valid.com' } });

        // Error should be cleared for URL
        expect(urlInput).not.toHaveAttribute('aria-invalid', 'true');
        expect(screen.queryByText('URLは必須です')).not.toBeInTheDocument();

        // Memo error should still persist
        expect(memoInput).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getAllByText('メモは必須です').length).toBeGreaterThanOrEqual(2);
    });
});
