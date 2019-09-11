import Utils from '../utils';
import { url } from 'inspector';

class DrinksAPI {

    static get TEST_MODE () {
        return false;
    }

    static get DETAILS_TEMPLATE () {
        return `cocktail_details`;
    }

    static get LIST_TEMPLATE () {
        return `cocktails_list`;
    }

    static get POPULAR_IDS () {
        return [11000, 11001, 11002, 11007, 17207];
    }

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
			    // TODO
            });
    }

    static getCocktails () {
        const query = window.location.search;
        if (query && query.indexOf('list=')) {
            const splitQuery = query.split('list=')[1];
            if (splitQuery && splitQuery.length) {
                const listType = splitQuery.toLowerCase();
                const succcess = (results) => {
                    console.warn(results);
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
                                // TODO
                            });
                    break;
                    case 'virgin':
                        fetch(`${this.API_URL('virgin', 'non_alcoholic')}`)
                            .then(value => value.json())
                            .then(results => {
                                succcess(results);
                            })
                            .catch(e => {
                                // TODO
                            });
                    break;
                    default:
                        fetch(`${this.API_URL('filter', listType)}`)
                            .then(value => value.json())
                            .then(results => {
                                succcess(results);
                            })
                            .catch(e => {
                                // TODO
                            });

                }
                return;
            }
        }
        //window.location.href = '/';
        return;
    }

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