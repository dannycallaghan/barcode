import Utils from '../utils';

/**
 * NEWS CLASS
 * Deals with the News and News Articles pages
 * 
 * /js/news/index.js
 */
class News {

    /**
     * Reference to the template used for recipes
     * 
     * @return {string} ID of the template
     */
    static get NEWS_TEMPLATE () {
        return `cocktail_news`;
    }

    /**
     * Url of the local data
     * 
     * @return {string} Url of the local json file
     */
    static get NEWS_URL () {
        return `/data/news.json`;
    }

    /**
     * Gets the local json and sends all of the data to the template
     * 
     * @return void
     */
    static getAllNews () {
        const succcess = (results) => {
            Utils.TemplateEngine.createHTML(`${this.NEWS_TEMPLATE}`, { data: results }, 'cocktail-news');
        };
        fetch(`${this.NEWS_URL}`)
		    .then(response => response.json())
		    .then(results => {
                succcess(results);	
		    })
		    .catch(e => {
			    Utils.TemplateEngine.noData('cocktail-news');
            });
    }

    /**
     * Gets the local json and sends the article that matches the ID in the address bar
     * 
     * @return void
     */
    static getNews () {
        const query = window.location.search;
        if (query && query.indexOf('id=')) {
            const splitQuery = query.split('id=')[1];
            if (splitQuery && splitQuery.length && parseInt(splitQuery, 10)) {
                const id = parseInt(splitQuery, 10);
                const succcess = (results) => {
                    const article = results.filter(article => {
                        return article.id === id;
                    });
                    if (!article.length) {
                        window.location.href = '/';
                        return;
                    }
                    Utils.TemplateEngine.createHTML(`${this.NEWS_TEMPLATE}`, { data: article }, 'cocktail-news');
                };
                fetch(`${this.NEWS_URL}`)
                    .then(response => response.json())
                    .then(results => {
                        succcess(results);	
                    })
                    .catch(e => {
                        Utils.TemplateEngine.noData('cocktail-news');
                    });
                return;
            }
        }
        window.location.href = '/';
        return;
    }

}

export default News;