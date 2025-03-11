import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import veeValidatePlugin from './plugins/vee-validate'

const app = createApp(App)
app.use(router)
app.use(veeValidatePlugin)
app.mount('#app') 