import Utils from '../utils';
import { url } from 'inspector';

/**
 * DRINKSAPI CLASS
 * Deals with talking to The Cocktail DB
 * 
 * /js/drinks-api/index.js
 */
class DrinksAPI {

    /**
     * Set test mode (get local data if we're testing, remote data if not)
     */
    static get TEST_MODE () {
        return false;
    }

    /**
     * Reference to the template used for recipes
     * 
     * @return {string} ID of the template
     */
    static get DETAILS_TEMPLATE () {
        return `cocktail_details`;
    }

    /**
     * Reference to the template used for the lists
     * 
     * @return {string} ID of the template
     */
    static get LIST_TEMPLATE () {
        return `cocktails_list`;
    }

    /**
     * IDs for the Popular section, each one is a cocktail
     * 
     * @return {string} ID of the template
     */
    static get POPULAR_IDS () {
        return [11000, 11001, 11002, 11007, 17207];
    }

    /**
     * Works out which API URL we should be using
     * 
     * @param {string} category - What section we're on
     * @param {number} id - If we're asking for a particular recipe, this is the ID
     * 
     * @return {string} The url
     */
    static API_URL (category, id) {
        let api = `https://www.thecocktaildb.com/api/json/v1/1/`;
        let suffix = this.TEST_MODE ? '.json' : '.php'; 
        let query = ``;
        let dest;
        if (this.TEST_MODE) {
            api = `/local_data`;
        }
        switch(category) {
            case 'random':
                dest = `random`;
            break;
            case 'by-id':
                dest = `lookup`;
                query = `?i=${id}`;
            break;
            case 'filter':
                dest = `filter`;
                query = `?i=${id}`;
            break;
            case 'virgin':
                dest = `filter`;
                query = `?a=${id}`;
            break;
            default:
        }
        return `${api}${dest}${suffix}${query}`;
    }

    /**
     * Get a cocktail recipe from an ID.
     * 
     * @param {string} type - What section we're on
     * @param {number} id - If we're asking for a particular recipe, this is the ID
     * 
     * @return void
     */
    static getCocktailDetails (type, id) {
        const succcess = (results) => {
            Utils.TemplateEngine.createHTML(`${this.DETAILS_TEMPLATE}`, { data: results }, 'cocktail-data');
        };
        fetch(`${this.API_URL(type, id)}`)
		    .then(response => response.json())
		    .then(results => {
                succcess(results);	
		    })
		    .catch(e => {
                Utils.TemplateEngine.noData('cocktail-data');
            });
    }

    /**
     * Get a list of cocktails
     * 
     * @return void
     */
    static getCocktails () {
        const query = window.location.search;
        if (query && query.indexOf('list=')) {
            const splitQuery = query.split('list=')[1];
            if (splitQuery && splitQuery.length) {
                const listType = splitQuery.toLowerCase();
                const succcess = (results) => {
                    Utils.TemplateEngine.createHTML(`${this.LIST_TEMPLATE}`, { data: results }, 'cocktail-data');
                };
                switch (listType) {
                    case 'popular':
                        const urls = this.POPULAR_IDS.map(id => {
                            return fetch(`${this.API_URL('by-id', id)}`).then(value => value.json());
                        });
                        Promise.all(urls)
                            .then(results => {
                                succcess(results);
                            })
                            .catch(e => {
                                Utils.TemplateEngine.noData('cocktail-data');
                            });
                    break;
                    case 'virgin':
                        fetch(`${this.API_URL('virgin', 'non_alcoholic')}`)
                            .then(value => value.json())
                            .then(results => {
                                succcess(results);
                            })
                            .catch(e => {
                                Utils.TemplateEngine.noData('cocktail-data');
                            });
                    break;
                    default:
                        fetch(`${this.API_URL('filter', listType)}`)
                            .then(value => value.json())
                            .then(results => {
                                succcess(results);
                            })
                            .catch(e => {
                                Utils.TemplateEngine.noData('cocktail-data');
                            });

                }
                return;
            }
        }
        window.location.href = '/';
        return;
    }

    /**
     * Determines what type of recipe to show. Random, or by ID. Gets the ID from the url.
     * 
     * @return void
     */
    static getCocktail () {
        const query = window.location.search;
        if (query && query.indexOf('id=')) {
            const splitQuery = query.split('id=')[1];
            if (splitQuery && splitQuery.length && (parseInt(splitQuery) || splitQuery === 'random')) {
                const id = splitQuery;
                if (id === 'random') {
                    this.getCocktailDetails('random');
                    return;
                }
                this.getCocktailDetails('by-id', id);
                return;
            }
        }
        window.location.href = '/';
        return;
    }


}

export default DrinksAPI;