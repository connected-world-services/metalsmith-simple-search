Metalsmith Simple Search
========================

This makes it really easy to add [Simple Jekyll Search](https://github.com/christian-fei/Simple-Jekyll-Search) to your Metalsmith project. Simply run all of your files through this plugin and it will generate your `search.json` file.

[![npm version][npm-badge]][npm-link]
[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Installation
------------

`npm` can do this for you.

    npm install --save metalsmith-simple-search


Usag
-----

Metadata properties are copied to the resulting JSON objects, optionally passing through filters.  First, this is an example that shows the default options in the JSON format. You do not need to specify any of these unless you want to override the default.

    {
        "plugins": {
            "metalsmith-simple-search": {
                "destinationJs": "simple-search.min.js",
                "destinationJson": "index.json",
                "index": {
                    "title": true,
                    "keywords": true,
                    "contents": "html"
                },
                "match": "**/*.{htm,html}",
                "matchOptions": {}
            }
        }
    }

This is how you would use it in JavaScript. Again, these are the defaults and don't need to be specified unless you want to override what they do.

    // Load the plugin
    var simpleSearch = require("metalsmith-simple-search");

    // Use this in your list of plugins.
    .use(simpleSearch())

    // Alternately, you can specify options. The values shown here are the
    // defaults and can be overridden.
    use(simpleSearch({
        // Where to save the file that performs the JavaScript-based searches
        // in a browser.
        destinationJs: "simple-search.min.js",

        // Where to save the resulting JSON file that contains search words.
        destinationJson: "search.json",

        // Metadata fields to index and how to index them. A lengthier
        // description follows after the example.
        index: {
            title: true,
            keywords: true
            contents: "html"
        },

        // Pattern of files to match so only some files are placed into the
        // search index.
        match: "**/*.{htm,html}",

        // Options for matching files. See minimatch for more information.
        matchOptions: {}

        // Transform the filename into a URL for the search engine. The
        // result from this file is saved as the ".url" property in the
        // per-file search object.
        transformUrl: function (filename) {
            return "/" + filename;
        }
    }));

This uses [minimatch] to match files. The `.matchOptions` object can be filled with options that the [minimatch] library uses.

The `index` property will determine how a particular file's metadata is indexed. It can be set to one of several values.

* `false` or `null` - Do not index this property. Great for overriding defaults.
* `true` - Index this property. If the value is an object, call `.toString()` on it first. If the value is an array, join with `" "`. Once it is a text string, index as normal by splitting into keywords, sorting, and removing duplicates.
* `"html"` - Convert the value to a string then remove all HTML tags and unescape any escaped content. This means `<div class="xyz">text</div>` turns into `text` (HTML elements removed).
* `"markdown"` or `"md"` - Assume the value is markdown and remove some non-text markup.
* `outStr = function (inStr)` - A custom function of your own that will take the string value of this metadata and convert it into a cleansed version.

You need to also use the `browser/jekyll-search.js` or `browser/jekyll-search.min.js` in the browser and configure it. Those files are included in this repository. To configure it you will need to execute some JavaScript on page load. Please see the [Jekyll Simple Search] site or the [browser/README.md](browser/README.md) file for great instructions on how to finish setting this up.

The only reason the `browser/` files exist in this repository is because the `jekyll-simple-search` npm module pulls in far too many dependencies (like gulp) during installation. I only want one build system, please.


Additional Methods
------------------

In order to facilitate testing, two additional methods are available on the exported function.


### `str = simpleSearch.makeKeywords(str)`

Convert the incoming string into a list of keywords, space separated. The current implementation will change the input string into lowercase, remove punctuation from the beginning and end of words, remove non-word items and remove duplicate items from the results.


### `str = simpleSearch.stripMarkdown(str)`

A very simple filter that removes link markup from markdown, preserving the link text.


Development
-----------

This uses Jasmine, Istanbul and ESLint for tests.

    # Install dependencies.
    npm install

    # Run the tests
    npm run test

This plugin is licensed under the [MIT License][License] with additional clauses. See the [full license text][License] for information.

[codecov-badge]: https://img.shields.io/codecov/c/github/connected-world-services/metalsmith-simple-search/master.svg
[codecov-link]: https://codecov.io/github/connected-world-services/metalsmith-simple-search?branch=master
[dependencies-badge]: https://img.shields.io/david/connected-world-services/metalsmith-simple-search.svg
[dependencies-link]: https://david-dm.org/connected-world-services/metalsmith-simple-search
[devdependencies-badge]: https://img.shields.io/david/dev/connected-world-services/metalsmith-simple-search.svg
[devdependencies-link]: https://david-dm.org/connected-world-services/metalsmith-simple-search#info=devDependencies
[Simple Jekyll Search]: https://github.com/christian-fei/Simple-Jekyll-Search
[License]: LICENSE.md
[metalsmith-hbt-md]: https://github.com/ahdiaz/metalsmith-hbt-md
[metalsmith-models]: https://github.com/jaichandra/metalsmith-models
[metalsmith-mustache-metadata]: https://github.com/connected-world-services/metalsmith-mustache-metadata
[metalsmith-relative-links]: https://github.com/connected-world-services/metalsmith-relative-links
[minimatch]: https://github.com/isaacs/minimatch
[npm-badge]: https://img.shields.io/npm/v/metalsmith-simple-search.svg
[npm-link]: https://npmjs.org/package/metalsmith-simple-search
[travis-badge]: https://img.shields.io/travis/connected-world-services/metalsmith-simple-search/master.svg
[travis-link]: http://travis-ci.org/connected-world-services/metalsmith-simple-search
