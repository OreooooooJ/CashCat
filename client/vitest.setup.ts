import { beforeAll } from 'vitest';
import { config } from '@vue/test-utils';
import { JSDOM } from 'jsdom';
import { defineRule } from 'vee-validate';
import { required, min, max, email, min_value, max_value } from '@vee-validate/rules';

// Set up JSDOM for component tests
beforeAll(() => {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
  global.window = dom.window;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
});

// Set up vee-validate rules
defineRule('required', required);
defineRule('min', min);
defineRule('max', max);
defineRule('email', email);
defineRule('min_value', min_value);
defineRule('max_value', max_value);

// Configure Vue Test Utils
config.global.stubs = {
  transition: false,
  'transition-group': false
}; 