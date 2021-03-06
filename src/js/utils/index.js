/**
 * UTILS CLASS
 * Utility functions used anywhere within the site
 * 
 * NOTE:
 * As credited below, and in the report.html, the function below (templateToHTML)
 * was written by John Resig and featured in a blog post in 2008. More details
 * can be found in the report.html file.
 * 
 * /js/utils/index.js
 */
class Utils {}

/**
 * SHRINKHEADER CLASS
 * Adds a class to the body when a user scrolls, to shrink the header and show more content
 */
Utils.ShrinkHeader = class {

    constructor () {
        this.scrollPos = 64; // Scroll position, in pixels, when to trigger the shrinking header
        this.shrinkClass = 'body--scrolled'; // Class to add to the body
    }

    /**
     * Initialise the header script
     * 
     * @return void
     */
    init () {
        // We don't want this to work on the homepage
        if (document.querySelectorAll('.video-wrapper').length) {
            return;
        }

        // Listen for the scroll event */
        window.addEventListener('scroll', e => {
            // Event heard. Call the scrollPage function */
            this.scrollPage();
        }, false);

        // Now call the function anyway, so we know where we are after refresh, etc
        this.scrollPage();
    }

    /**
     * Adds the scrolled class
     * 
     * @return void
     */
    scrollPage () {
        const body = document.body;
        // Grab the latest scroll position */
        const sy = this.scrolledPos();
        // Check if we've scrolled far enough
        if (sy > this.scrollPos) {
            // Add the scrolled class
            body.classList.add(this.shrinkClass);
        } else {
            // Add the scrolled class
            body.classList.remove(this.shrinkClass);
        }
    }

    /**
     * Returns the current scroll position of the page
     * 
     * @return Window y position
     */
    scrolledPos () {
        return window.pageYOffset || document.documentElement.scrollTop;
    }
};

/**
 * DRAWER CLASS
 * Adds a navigation drawer for smaller screens
 */
Utils.Drawer = class {

    constructor () {
        this.menuButtons = document.querySelectorAll('.toggle-drawer'); // Grab all elements with a toggle-drawer class
        this.drawerElement = document.querySelector('.drawer'); // The drawer itself
        this.cloak = document.getElementById('cloak'); // The shaded overlay when the drawer is open
        this.drawerClass = 'body--drawer-visible'; // Class to add to the body to slide the drawer in and out
        this.body = document.body; // Grab a handle on th body
    }

    /**
     * Initialise the drawer script
     * 
     * @return void
     */
    init () {
        // Add a click event to every element with the toggle class
        // This is a node list, so turn it into an array first
        [].slice.call(this.menuButtons).forEach(btn => {
            btn.addEventListener('click', e => {
                // Call the toggle function
                this.toggleDrawer()
            }, false);
        });

        // Listen for a click event on the cloak, to close the drawer
        this.cloak.addEventListener('click', e => {
            // Call the toggle function
            this.toggleDrawer()
        }, false);
    }

    /**
     * Add or remove the toggle class to show the drawer
     * 
     * @return void
     */
    toggleDrawer () {
        // Toggle the class
        this.body.classList.toggle(this.drawerClass);
        // Call the aria change function
        this.toggleAriaAttr();
    }

    /**
     * Toggles the ARIA attribute of the drawer.
     * 
     * @return void
     */
    toggleAriaAttr () {
        if (this.body.classList.contains(this.drawerClass)) {
            this.drawerElement.setAttribute('aria-hidden', false);
        } else {
            this.drawerElement.setAttribute('aria-hidden', true);
        }
    }

};

/**
 * TEMPLATEENGINE CLASS
 * Custom lightweight templating engine.
 * Heavily taken from:
 * John Resig – http://ejohn.org/ – MIT Licensed
 */
Utils.TemplateEngine = class {

    /**
    * Stores the template data, so we don't keep querying the DOM
    * 
    * @return Empty object
    */
    static get CACHE () {
        return {};
    }

    /**
    * Takes the template, model and destination to pass on to the templating function
    *
    * @param {string}      template - ID of script template
    * @param {object}   model - Data model to pass to template 
    * @param {string}      destination - ID of where the finished template is going to go
    * 
    *@return void
    */
    static createHTML (template, model, destination) {
        const element = document.getElementById(destination);
        if (element) {
            element.innerHTML = this.templateToHTML(template, model);
        }
        const event = new Event('templateLoaded');
        window.dispatchEvent(event);
    }

    /**
    * Combines dynamic data with our templates and returns the result
    * John Resig – http://ejohn.org/ – MIT Licensed
    * 
    * @param {string}   str - ID of script template
    * @param {object}   data - Data model to pass to template
    * 
    * @return The finished template
    */
    static templateToHTML (str, data) {
        const fn = !/\W/.test(str) ?
            this.CACHE[str] = this.CACHE[str] ||
            this.templateToHTML(document.getElementById(str).innerHTML) :

                new Function("obj", "var p=[],print=function(){p.push.apply(p,arguments);};" +

                "with(obj){p.push('" +

                str
                    .replace(/[\r\t\n]/g, " ")
                    .split("<%").join("\t")
                    .replace(/((^|%>)[^\t]*)'/g, "$1\r")
                    .replace(/\t=(.*?)%>/g, "',$1,'")
                    .split("\t")
                    .join("');")
                    .split("%>")
                    .join("p.push('")
                    .split("\r")
                    .join("\\'")

                    + "');}return p.join('');");

        return data ? fn( data ) : fn;
    }

    /**
    * Show an error message if we can't get any info 
    * 
    * @param {string}   str - ID of destination template
    */
    static noData (str) {
        document.body.classList.remove('pending');
        document.getElementById(str).innerHTML = `<p class="no-data"><i class="material-icons">error_outline</i> Uh oh! We're unable to display that infomation. Please check your connection and try again.</p>`;
    }

};

/**
 * Back To Top functionality
 * 
 * @return void
 */
Utils.backToTop = function () {
    const el = document.getElementById('back-to-top');
    if (el) {
        el.addEventListener('click', (e) => {
            window.scrollTo(0, 0);
            e.preventDefault();
        }, false);
    }
}

/**
 * Starts the splash screen by removing the pending class from the body
 * 
 * @return void
 */
Utils.startSplash = function () {
    const firstTimer = 500;
    const secondTimer = 3000;
    const body = document.body;
    window.setTimeout(() => {
        body.classList.remove('splash-1');
    }, firstTimer);
    window.setTimeout(() => {
        body.classList.remove('splash-2');
    }, secondTimer);
}

/**
 * Set the stylesheet property for video height for mobile devices
 * 
 * @return void
 */
Utils.getHeightForVideo = function () {
    const viewHeight = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--viewHeight', `${viewHeight}px`);
};

/**
 * Add a click event to the buttons on the cocktail list pages
 * 
 * @return void
 */
Utils.activateFullDetailButtons = function () {
    const addClickEvents = () => {
        const btns = document.querySelectorAll('button.full-details-button');
        if (!btns.length) {
            return;
        }
        [].slice.call(btns).forEach(btn => {
            btn.addEventListener('click', e => {
                window.location.href = e.target.dataset.link;
                e.preventDefault();
            }, false);
        });
    };
    const removePending = () => {
        document.body.classList.remove('pending');
    };
    window.addEventListener('templateLoaded', e => {
        removePending();
        addClickEvents();
    }, false);
};


export default Utils;