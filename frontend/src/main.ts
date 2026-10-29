import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { setSessionLostHandler } from './api';
import router from './router';
import { useAuthStore } from './stores/auth';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'bootstrap-icons/font/bootstrap-icons.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

setSessionLostHandler(() => {
  useAuthStore(pinia).clearSession();
  void router.push('/login');
});

app.mount('#app');
