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
        expect(screen.getByLabelText(/URL/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Memo/)).toBeInTheDocument();
        expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
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

        expect(screen.getByLabelText(/URL/)).toBeDisabled();
    });

    it('submits form with correct data', async () => {
        render(
            <BookmarkModal
                isOpen={true}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        const urlInput = screen.getByLabelText(/URL/);
        const memoInput = screen.getByLabelText(/Memo/);
        const tagsInput = screen.getByLabelText(/Tags/);

        fireEvent.change(urlInput, { target: { value: 'https://new.com' } });
        fireEvent.change(memoInput, { target: { value: 'New Memo' } });
        fireEvent.change(tagsInput, { target: { value: 'tag1, tag2' } });

        const saveButton = screen.getByRole('button', { name: 'Save' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith('https://new.com', 'New Memo', ['tag1', 'tag2']);
        });
    });
});
