/**
 * UTILS CLASS
 * Utility functions used anywhere within the site
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
     */
    init () {
        console.warn('init');
        // Listen for the scroll event */
        window.addEventListener('scroll', e => {
            // Event heard. Call the scrollPage function */
            this.scrollPage();
            console.warn('scrolled');
        }, false);

        // Now call the function anyway, so we know where we are after refresh, etc
        this.scrollPage();
    }

    /**
     * Adds the scrolled class
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
     */
    toggleDrawer () {
        console.warn('clicked');
        // Toggle the class
        this.body.classList.toggle(this.drawerClass);
        // Call the aria change function
        this.toggleAriaAttr();
    }

    /**
     * Toggles the ARIA attribute of the drawer.
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
    */
    static get CACHE () {
        return {};
    }

    /**
    * Takes the template, model and destination to pass on to the templating function
    */
    static createHTML (template, model, destination) {
        const element = document.getElementById(destination);
        if (element) {
            element.innerHTML = this.templateToHTML(template, model);
        }
    }

    /**
    * Combines dynamic data with our templates and returns the result
    * John Resig – http://ejohn.org/ – MIT Licensed
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

};

/**
 * FIREBASE CLASS
 * Looks after the Firebase communication
 */
Utils.Firebase = class {

    /**
    * Initialises the app
    */
    static init () {

        if (firebase.apps.length) {
            return;
        }

        const FirebaseConfig = {
            apiKey: 'AIzaSyD85xYzvb9MuFL0Qhl8rRo816ynrmyltAM',
            authDomain: 'magsmag-d7978.firebaseapp.com',
            projectId: 'magsmag-d7978'
        };

        firebase.initializeApp(FirebaseConfig);
        firebase.firestore().enablePersistence()
            .catch(function(err) {});
    }

};


export default Utils;