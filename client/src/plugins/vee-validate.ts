import { configure, defineRule } from 'vee-validate';
import { required, min, min_value } from '@vee-validate/rules';

// Define the rules
defineRule('required', required);
defineRule('min', min);
defineRule('min_value', min_value);

// Configure vee-validate
configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: false,
  validateOnModelUpdate: true,
});

export default {
  install: () => {
    // Rules are already defined above
  },
};
