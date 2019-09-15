import 'whatwg-fetch'
import DrinksAPI from './drinks-api';
import News from './news';
import Utils from './utils';

/**
 * Kicks everything off
 * 
 * /js/main.js
 */

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
        Utils.activateFullDetailButtons();
    }

    /**
     * If we're on a detail page, pass it to the API and let it determine what to show
     */
    if (document.getElementById('category-cocktail')) {
        DrinksAPI.getCocktail();
        Utils.activateFullDetailButtons();
    }

    /**
     * If we're on the News index page, get the all news
     */
    if (document.getElementById('category-cocktail-news')) {
        News.getAllNews();
        Utils.activateFullDetailButtons();
    }

    /**
     * If we're on an article page page, pass it to the News and let it determine which one to show
     */
    if (document.getElementById('category-cocktail-article')) {
        News.getNews();
    }

});