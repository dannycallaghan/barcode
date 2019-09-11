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

    Utils.backToTop();

    if (document.getElementById('category-list')) {
        DrinksAPI.getCocktails();
    }

    if (document.getElementById('category-cocktail')) {
        console.warn('OK');
        DrinksAPI.getCocktail();
    }

});