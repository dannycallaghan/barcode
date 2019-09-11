import DrinksAPI from './drinks-api';
import Utils from './utils';

/**
 * Initialise our main app code when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', event => {

    /**
     * Initialise the drawer functionality for smaller screen sizes
     */
    const Drawer = new Utils.Drawer();
    Drawer.init();

    /**
     * Initialise the shrinking header
     */
    const ShrinkHeader = new Utils.ShrinkHeader();
    ShrinkHeader.init();

    /**
     * Add the back to top functionality
     */
    Utils.backToTop();

    /**
     * Start the splash screen
     */
    if (document.getElementById('splash-screen')) {
        Utils.startSplash();
    }

    /**
     * If we're on a list page, pass it to the API and let it determine what to show
     */
    if (document.getElementById('category-list')) {
        DrinksAPI.getCocktails();
    }

    /**
     * If we're on a detail page, pass it to the API and let it determine what to show
     */
    if (document.getElementById('category-cocktail')) {
        DrinksAPI.getCocktail();
    }



    // First we get the viewport height and we multiple it by 1% to get a value for a vh unit
let vh = window.innerHeight * 0.01;
// Then we set the value in the --vh custom property to the root of the document
document.documentElement.style.setProperty('--vh', `${vh}px`);
console.warn(vh);



});