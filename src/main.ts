import './style.css';
import { initNav } from './nav';
import { initMap } from './map';
import { initContactForm } from './contactForm';
import { initCatalogScroll, initScrollHint } from './scroll';
import { initTheme } from './theme';
import { initMotion } from './motion';
import { initAromaCatalog } from './aromas';

initTheme();
initMotion();
initNav();
void initMap();
initContactForm();
initCatalogScroll();
initScrollHint();
initAromaCatalog();