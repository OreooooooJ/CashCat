import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import router from './router';
import './assets/main.css';
import veeValidatePlugin from './plugins/vee-validate';

// PrimeVue imports
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/lara-light-blue/theme.css'; // theme
import 'primeicons/primeicons.css'; // icons

// Import PrimeVue components
import SelectButton from 'primevue/selectbutton';
import Dropdown from 'primevue/dropdown';

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(veeValidatePlugin);
app.use(PrimeVue, { ripple: true });

// Register PrimeVue components globally
app.component('SelectButton', SelectButton);
app.component('Dropdown', Dropdown);

app.mount('#app');
