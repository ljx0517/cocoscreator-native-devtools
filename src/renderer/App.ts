
import 'vuetify/dist/vuetify.css'
import './assets/css/materialdesignicons.min.css'
import './assets/css/googlefonts.css'
import './assets/css/style.css'
import Vuetify from 'vuetify';
import Vue from "vue";
import App from "./AppRenderer.vue";
// @ts-ignore
import VueSplit from 'vue-split-panel'

Vue.config.productionTip = false;

Vue.use(Vuetify);
Vue.use(VueSplit)
new Vue({
  vuetify: new Vuetify({
    theme: { dark: true }
  }),
  render: h => h(App)
}).$mount("#app");
