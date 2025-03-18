import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import UserProfile from '../UserProfile.vue';
import api from '@/utils/api';

// Mock the api module
vi.mock('@/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))

describe('UserProfile', () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  it('should render the component', async () => {
    // Mock API response
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      createdAt: '2022-12-27T00:00:00.000Z',
      transactionCount: 10,
      budgetCount: 5
    };
    
    vi.mocked(api.get).mockResolvedValue({
      data: mockUser,
      status: 200
    });
    
    // Mount component
    const wrapper = mount(UserProfile);
    
    // Initially should show loading state
    expect(wrapper.find('.loading').exists()).toBe(true);
    
    // Wait for API call to resolve
    await flushPromises();
    
    // Debug: Let's see what the wrapper contains
    console.log('Profile content after API call:', wrapper.find('.profile-content').html());
    
    // Should no longer be loading
    expect(wrapper.find('.loading').exists()).toBe(false);
    
    // Should contain user data
    expect(wrapper.text()).toContain('Test User');
    expect(wrapper.text()).toContain('test@example.com');
    expect(wrapper.text()).toContain('Member Since');
    expect(wrapper.text()).toContain('Transactions');
    expect(wrapper.text()).toContain('10');
    expect(wrapper.text()).toContain('Budgets');
    expect(wrapper.text()).toContain('5');
  });
}); 