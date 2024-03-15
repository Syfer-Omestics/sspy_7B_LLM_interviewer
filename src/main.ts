
import { createApp } from "vue";
import App from "./App.vue";
import { setupI18n } from "./locales";
import { setupAssets, setupScrollbarStyle } from "./plugins";
import { setupStore } from "./store";
import { setupRouter } from "./router";
import "viewerjs/dist/viewer.css";
import VueViewer from "v-viewer";

async function bootstrap() {
	const app = createApp(App);
	setupAssets();

	setupScrollbarStyle();

	setupStore(app);

	setupI18n(app);

	app.use(VueViewer);

	await setupRouter(app);

	app.mount("#app");
}

bootstrap();
