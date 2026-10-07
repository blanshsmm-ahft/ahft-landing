import './style.css';
import { initTabBar } from './tabBar';
import { initMap } from './map';
import { initContactForm } from './contactForm';
import { initCatalogScroll, initScrollHint } from './scroll';
import { initTheme } from './theme';
import { initMotion } from './motion';
import { initCatalogSpin } from './catalogSpin';
import { initAromaCatalog } from './aromas';

initTheme();
initMotion();
initTabBar();
void initMap();
initContactForm();
initCatalogScroll();
initScrollHint();
initCatalogSpin();
initAromaCatalog();