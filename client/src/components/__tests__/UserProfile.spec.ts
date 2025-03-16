import { describe, it, expect, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import UserProfile from '../UserProfile.vue';

describe('UserProfile', () => {
  it('should render the component', async () => {
    // Mock fetch to return a successful response
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 1,
        name: 'Test User',
        email: 'test@example.com',
        createdAt: '2022-12-27T00:00:00.000Z',
        transactionCount: 10,
        budgetCount: 5
      })
    });
    
    // Mock localStorage and fetch
    vi.stubGlobal('localStorage', {
      getItem: vi.fn().mockReturnValue('fake-token'),
      setItem: vi.fn()
    });
    vi.stubGlobal('fetch', fetchMock);
    
    try {
      const wrapper = mount(UserProfile);
      
      // Initially should show loading state
      expect(wrapper.find('.loading').exists()).toBe(true);
      
      // Wait for fetch to complete
      await flushPromises();
      
      // Should contain user data
      expect(wrapper.text()).toContain('Test User');
      expect(wrapper.text()).toContain('test@example.com');
      expect(wrapper.text()).toContain('Member Since');
      expect(wrapper.text()).toContain('Transactions');
      expect(wrapper.text()).toContain('10');
      expect(wrapper.text()).toContain('Budgets');
      expect(wrapper.text()).toContain('5');
    } finally {
      // Clean up
      vi.unstubAllGlobals();
    }
  });
}); 