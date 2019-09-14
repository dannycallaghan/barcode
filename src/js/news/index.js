import Utils from '../utils';

class News {

    static get TEST_MODE () {
        return false;
    }

    static get NEWS_TEMPLATE () {
        return `cocktail_news`;
    }

    static get NEWS_URL () {
        return `/data/news.json`;
    }

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
			    // TODO
            });
    }

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
                    Utils.TemplateEngine.createHTML(`${this.NEWS_TEMPLATE}`, { data: article }, 'cocktail-news');
                };
                fetch(`${this.NEWS_URL}`)
                    .then(response => response.json())
                    .then(results => {
                        succcess(results);	
                    })
                    .catch(e => {
                        // TODO
                    });
                return;
            }
        }
        window.location.href = '/';
        return;
    }

}

export default News;