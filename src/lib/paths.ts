/** En la demostración (enrutado con #) los enlaces internos llevan '#' delante y se abren en la misma pestaña. */
export const IS_DEMO = Boolean(import.meta.env.VITE_DEMO);
export const appHref = (path: string) => (IS_DEMO ? '#' + path : path);
export const newTab = IS_DEMO ? {} : { target: '_blank', rel: 'noopener noreferrer' };
