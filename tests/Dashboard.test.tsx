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
        vi.mocked(api.getBookmarks).mockResolvedValue({ items: mockBookmarks, total: 2 });
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

        vi.mocked(api.getBookmarks).mockResolvedValue({ items: manyBookmarks.slice(0, 12), total: 25 });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Site 1')).toBeInTheDocument();
        });

        // Check pagination controls are visible
        expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

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

        vi.mocked(api.getBookmarks).mockResolvedValue({ items: manyBookmarks.slice(0, 12), total: 25 });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Site 1')).toBeInTheDocument();
        });

        // Navigate to page 2
        const nextButton = screen.getByText('Next');
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(api.getBookmarks).toHaveBeenCalledWith(2, 12, undefined);
        });

        // Navigate to page 3 (last page)
        fireEvent.click(nextButton);

        await waitFor(() => {
            expect(api.getBookmarks).toHaveBeenCalledWith(3, 12, undefined);
        });

        // Next button should be disabled on last page
        await waitFor(() => {
            expect(screen.getByText('Page 3 of 3')).toBeInTheDocument();
        });
        expect(nextButton).toBeDisabled();
    });

    it('hides pagination when only one page exists', async () => {
        // Only 2 items, less than page size (12)
        vi.mocked(api.getBookmarks).mockResolvedValue({ items: mockBookmarks, total: 2 });

        render(
            <BrowserRouter>
                <Dashboard />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Example Site')).toBeInTheDocument();
        });

        // Pagination controls should not be visible
        expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
        expect(screen.queryByText('Prev')).not.toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
});
