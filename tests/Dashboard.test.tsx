import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Dashboard } from '../src/pages/Dashboard';
import { api } from '../src/api/client';

// Mock the API client
vi.mock('../src/api/client', () => ({
    api: {
        getMe: vi.fn(),
        getBookmarks: vi.fn(),
        deleteBookmark: vi.fn(),
        getBookmark: vi.fn(),
        updateBookmark: vi.fn(),
        addBookmark: vi.fn(),
    },
    canEdit: (authority: number) => authority >= 2,
    AUTHORITY: {
        NONE: 0,
        READ_ONLY: 1,
        READ_WRITE: 2,
        ADMIN: 9
    }
}));

// Mock Navbar
vi.mock('../src/components/Navbar', () => ({
    Navbar: () => <div data-testid="navbar">Navbar</div>
}));

const mockBookmarks = [
    {
        hashed_id: '1',
        url: 'https://example.com',
        memo: 'Example Site',
        tags: ['tag1'],
        created_at: '2023-01-01',
        updated_at: '2023-01-01'
    },
    {
        hashed_id: '2',
        url: 'https://test.com',
        memo: 'Test Site',
        tags: ['tag2'],
        created_at: '2023-01-02',
        updated_at: '2023-01-02'
    }
];

describe('Dashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getMe).mockResolvedValue({ name: 'testuser', authority: 2 }); // READ_WRITE authority
        vi.mocked(api.getBookmarks).mockResolvedValue({ items: mockBookmarks });
    });

    it('renders bookmark list', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
            expect(screen.getByText('Test Site')).toBeInTheDocument();
        });
    });

    it('opens delete confirmation modal', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Click delete button on first card
        const deleteButtons = screen.getAllByTitle('Delete');
        fireEvent.click(deleteButtons[0]);

        expect(screen.getByText('Delete Bookmark')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this bookmark? This action cannot be undone.')).toBeInTheDocument();

        // Check if target name is displayed
        // Check if target name is displayed (it appears twice: once in card, once in modal)
        expect(screen.getAllByText('Example Site')).toHaveLength(2);
    });

    it('filters bookmarks by tag', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        const filterInput = screen.getByPlaceholderText('Filter by tag...');
        fireEvent.change(filterInput, { target: { value: 'tag1' } });

        await waitFor(() => {
            expect(api.getBookmarks).toHaveBeenCalledWith(1, 12, 'tag1');
        });
    });

    it('edits a bookmark', async () => {
        vi.mocked(api.getBookmark).mockResolvedValue(mockBookmarks[0]);

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Click edit button on first card
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);

        // Wait for modal to open and populate
        await waitFor(() => {
            expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
        });

        // Change memo
        const memoInput = screen.getByLabelText('Memo');
        fireEvent.change(memoInput, { target: { value: 'Updated Memo' } });

        // Click save
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Confirm save - wait for confirmation modal to appear
        const confirmButton = await screen.findByRole('button', { name: 'Save Changes' });
        fireEvent.click(confirmButton);

        await waitFor(() => {
            expect(api.updateBookmark).toHaveBeenCalledWith(
                '1',
                'Updated Memo',
                ['tag1']
            );
        });
    });

    it('returns to add modal when canceling save confirmation', async () => {
        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Click Add Bookmark button
        const addButton = screen.getByText('Add Bookmark');
        fireEvent.click(addButton);

        // Wait for modal to open
        await waitFor(() => {
            expect(screen.getByLabelText('URL')).toBeInTheDocument();
        });

        // Fill in the form
        const urlInput = screen.getByLabelText('URL');
        const memoInput = screen.getByLabelText('Memo');
        fireEvent.change(urlInput, { target: { value: 'https://new.com' } });
        fireEvent.change(memoInput, { target: { value: 'New Site' } });

        // Click Save to show confirmation
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Wait for confirmation modal by finding the Add button
        await screen.findByRole('button', { name: 'Add' });
        expect(screen.getByText('Do you want to add this bookmark?')).toBeInTheDocument();

        // Click Cancel on confirmation
        const cancelButtons = screen.getAllByText('Cancel');
        const confirmCancelButton = cancelButtons[cancelButtons.length - 1]; // Get the last Cancel button (from confirm modal)
        fireEvent.click(confirmCancelButton);

        // Should return to add modal, not close everything
        await waitFor(() => {
            expect(screen.getByLabelText('URL')).toBeInTheDocument();
            expect(screen.getByDisplayValue('https://new.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('New Site')).toBeInTheDocument();
        });

        // Confirmation modal should be closed
        expect(screen.queryByText('Do you want to add this bookmark?')).not.toBeInTheDocument();
    });

    it('returns to edit modal when canceling save confirmation', async () => {
        vi.mocked(api.getBookmark).mockResolvedValue(mockBookmarks[0]);

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Click edit button on first card
        const editButtons = screen.getAllByTitle('Edit');
        fireEvent.click(editButtons[0]);

        // Wait for modal to open and populate
        await waitFor(() => {
            expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
        });

        // Change memo
        const memoInput = screen.getByLabelText('Memo');
        fireEvent.change(memoInput, { target: { value: 'Updated Memo' } });

        // Click save to show confirmation
        const saveButton = screen.getByText('Save');
        fireEvent.click(saveButton);

        // Wait for confirmation modal by finding the Save Changes button
        await screen.findByRole('button', { name: 'Save Changes' });
        expect(screen.getByText('Do you want to save the changes to this bookmark?')).toBeInTheDocument();

        // Click Cancel on confirmation
        const cancelButtons = screen.getAllByText('Cancel');
        const confirmCancelButton = cancelButtons[cancelButtons.length - 1]; // Get the last Cancel button (from confirm modal)
        fireEvent.click(confirmCancelButton);

        // Should return to edit modal, not close everything
        await waitFor(() => {
            expect(screen.getByLabelText('URL')).toBeInTheDocument();
            expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
            expect(screen.getByDisplayValue('Updated Memo')).toBeInTheDocument();
        });

        // Confirmation modal should be closed
        expect(screen.queryByText('Do you want to save the changes to this bookmark?')).not.toBeInTheDocument();
    });


    it('hides edit/delete buttons for read-only users', async () => {
        vi.mocked(api.getMe).mockResolvedValue({ name: 'readonly', authority: 1 }); // READ_ONLY authority

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Edit and Delete buttons should not be present
        expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
        expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

        // Add Bookmark button should not be present
        expect(screen.queryByText('Add Bookmark')).not.toBeInTheDocument();
    });

    it('navigates through pages', async () => {
        // Mock data with more than 12 items to trigger pagination
        const manyBookmarks = Array.from({ length: 25 }, (_, i) => ({
            hashed_id: `${i + 1}`,
            url: `https://example${i + 1}.com`,
            memo: `Site ${i + 1}`,
            tags: ['tag1'],
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        }));

        vi.mocked(api.getBookmarks).mockResolvedValue({ items: manyBookmarks.slice(0, 12) });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Site 1')).toBeInTheDocument();
        });

        // Check pagination controls are visible
        expect(screen.getByText('Page 1')).toBeInTheDocument();

        // Prev button should be disabled on first page
        const prevButton = screen.getByText('Prev');
        expect(prevButton).toBeDisabled();

        // Click Next button
        const nextButton = screen.getByText('Next');
        expect(nextButton).not.toBeDisabled();
        fireEvent.click(nextButton);

        // API should be called with page 2
        await waitFor(() => {
            expect(api.getBookmarks).toHaveBeenCalledWith(2, 12, undefined);
        });
    });

    it('disables Next button on last page', async () => {
        // Mock data for last page
        const manyBookmarks = Array.from({ length: 25 }, (_, i) => ({
            hashed_id: `${i + 1}`,
            url: `https://example${i + 1}.com`,
            memo: `Site ${i + 1}`,
            tags: ['tag1'],
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        }));

        // Initial page with 12 items
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: manyBookmarks.slice(0, 12) });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Site 1')).toBeInTheDocument();
        });

        // Page 2 also has 12 items
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: manyBookmarks.slice(12, 24) });

        // Navigate to page 2
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('Site 13')).toBeInTheDocument();
        });

        // Page 3 has only 1 item (last page)
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: manyBookmarks.slice(24, 25) });

        // Navigate to page 3 (last page)
        fireEvent.click(nextButton);

        // Wait for last page data to load
        await waitFor(() => {
            expect(screen.getByText('Site 25')).toBeInTheDocument();
        });

        // Next button should be disabled on last page (less than 12 items)
        expect(nextButton).toBeDisabled();
    });

    it('hides pagination when only one page exists', async () => {
        // Only 2 items, less than page size (12)
        vi.mocked(api.getBookmarks).mockResolvedValue({ items: mockBookmarks });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Pagination controls should not be visible on page 1 with less than pageSize items
        expect(screen.queryByText(/Page \d+/)).not.toBeInTheDocument();
        expect(screen.queryByText('Prev')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('handles bookmarks count as exact multiple of pageSize without empty page', async () => {
        // Exactly 24 bookmarks (2 pages of 12 items each)
        const exactMultipleBookmarks = Array.from({ length: 24 }, (_, i) => ({
            hashed_id: `${i + 1}`,
            url: `https://example${i + 1}.com`,
            memo: `Site ${i + 1}`,
            tags: ['tag1'],
            created_at: '2023-01-01',
            updated_at: '2023-01-01'
        }));

        // Page 1 with 12 items
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: exactMultipleBookmarks.slice(0, 12) });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Site 1')).toBeInTheDocument();
        });

        // Page 2 with 12 items
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: exactMultipleBookmarks.slice(12, 24) });

        // Navigate to page 2
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(screen.getByText('Site 13')).toBeInTheDocument();
        });

        // Page 3 would have 0 items (empty page)
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: [] });

        // After automatically going back to page 2, it will fetch page 2 data again
        vi.mocked(api.getBookmarks).mockResolvedValueOnce({ items: exactMultipleBookmarks.slice(12, 24) });

        // Try to navigate to page 3
        fireEvent.click(nextButton);

        // Should automatically go back to page 2 instead of showing empty page
        await waitFor(() => {
            expect(screen.getByText('Site 13')).toBeInTheDocument();
        });

        // Should still be on page 2
        expect(screen.getByText('Page 2')).toBeInTheDocument();
    });
});
