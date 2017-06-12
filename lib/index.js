/**
 * Metalsmith Simple Search plugin to allow client-side searching of a site.
 *
 * Uses the JavaScript from a similar project that lets you search
 * [Jekyll sites](https://github.com/christian-fei/Simple-Jekyll-Search)
 * as the driver behind the searching.
 *
 * @example
 * var simpleSearch = require("metalsmith-simple-search");
 *
 * // Create your metalsmith instace. When that is done, add the middleware
 * // like this.
 * metalsmith.use(simpleSearch({
 *     // configuration here
 * }));
 *
 * @module metalsmith-simple-search
 * @see {@link https://github.com/christian-fei/Simple-Jekyll-Search}
 */
"use strict";

/**
 * Metalsmith's file object.
 *
 * @typedef {Object} metalsmith-simple-search~metalsmithFile
 * @property {Buffer} contents
 * @property {string} mode
 */

/**
 * Metalsmith's collection of files.
 *
 * @typedef {Object.<string,metalsmith-simpl-search~metalsmithFile>} metalsmith-simple-search~metalsmithFileCollection
 */

/**
 * Data used for searching for a single file.
 *
 * @typedef {Object.<string,string>} metalsmith-simple-search~searchData
 * @property {string} url Associated URL in case the search finds something.
 */

var debug, fs, path, pluginKit, striptags, unescape;


/**
 * Creates the metadata for a single file object.
 *
 * The `options` passed may have altered `options.index` values. Only booleans
 * and functions are supported. Strings were converted into functions in
 * the factory middleware.
 *
 * @example
 * result = {};
 * Object.keys(files).forEach((filename) => {
 *     result[filename] = buildSearchData(files[filename], filename, options);
 * });
 *
 * @param {metalsmith-simple-search~metalsmithFile} file
 * @param {string} filename
 * @param {metalsmith-simple-search~options} options
 * @return {metalsmith-simple-search~searchData} search data
 */
function buildSearchData(file, filename, options) {
    var result;

    result = {};

    // Loop through the metadata properties
    Object.keys(options.index).forEach((metadataName) => {
        var cleansingFn, value;

        cleansingFn = options.index[metadataName];
        value = file[metadataName];

        if (!cleansingFn || !value) {
            // Skip if falsy cleansing function (meaning "do not index")
            // and skip if no data is available.
            return;
        }

        // First, convert to a string.
        if (Array.isArray(value)) {
            value = value.join(" ");
        } else if (Buffer.isBuffer(value)) {
            value = value.toString("utf8");
        } else {
            value = value.toString();
        }

        // Clean up the data and convert to the string that should be
        // saved in the search JSON data.
        value = cleansingFn(value);
        result[metadataName] = value;
    });

    // Assign the .url property
    result.url = options.transformUrl(filename);

    return result;
}


debug = require("debug")("metalsmith-simple-search");
fs = require("fs");
path = require("path");
pluginKit = require("metalsmith-plugin-kit");
striptags = require("striptags");
unescape = require("unescape");

/**
 * The options for the plugin.
 *
 * @typedef {Object} metalsmith-simple-search~options
 * @property {string} [destinationJson=search.json] The location of the final JSON document.
 * @property {string} [destinationJs=simple-search.min.js] Where to add the associated JavaScript file.
 * @property {Object} [index={title:true,keywords:true,contents:"html"}] Fields to index for searching.
 * @property {string} [match] Files to match, defaults to *.htm and *.html anywhere.
 * @property {Object} [matchOptions={}] Additional options for filename matching.
 * @property {boolean} [skipSearchJs=false] If true, do not add the JavaScript to the output files.
 * @property {Function} [transformUrl] Callback for converting a single file into a URL. Input is the filename, the returned string is the URL.
 */

/**
 * The Simple Search factory.
 *
 * @example
 * var simpleSearch = require("metalsmith-simple-search");
 *
 * // Make the metalsmith instance, then at the appropriate time, add this
 * // line.
 * metalsmith.use(simpleSearch({
 *     // options go here
 * }));
 *
 * @param {metalsmith-simple-search~options} options
 * @return {Function} middleware
 */
module.exports = (options) => {
    var jsPath, searchData;

    options = pluginKit.defaultOptions({
        destinationJson: "search.json",
        destinationJs: "simple-search.min.js",
        index: {
            title: true,
            keywords: true,
            contents: "html"
        },
        match: "**/*.{htm,html}",
        matchOptions: {},
        skipSearchJs: false,
        transformUrl: (filename) => {
            return `/${filename}`;
        }
    }, options);

    // Convert the index definitions to functions.
    Object.keys(options.index).forEach((metadataName) => {
        var value;

        value = options.index[metadataName];

        if (!value || typeof value === "function") {
            return;
        }

        if (value === "html") {
            value = (str) => {
                return module.exports.makeKeywords(module.exports.stripHtml(str));
            };
        } else if (value === "markdown" || value === "md") {
            value = (str) => {
                return module.exports.makeKeywords(module.exports.stripMarkdown(str));
            };
        } else if (value === "keywords") {
            value = module.exports.makeKeywords;
        } else {
            // Truthy values mean to keep the value as-is.
            value = (str) => {
                return str;
            };
        }

        options.index[metadataName] = value;
    });

    jsPath = path.resolve(__dirname, "..", "asset", "jekyll-search.min.js");

    return pluginKit.middleware({
        after: (files, metalsmith, done) => {
            // Save search metadata to files object
            debug("Building JSON: %s", options.destinationJson);
            pluginKit.addFile(files, options.destinationJson, searchData);

            // Load JS and save on files object
            if (options.skipSearchJs) {
                done();
            } else {
                debug("Building JavaScript: %s", options.destinationJs);
                fs.readFile(jsPath, (err, buffer) => {
                    if (!err) {
                        pluginKit.addFile(files, options.destinationJs, buffer);
                    }

                    done(err);
                });
            }
        },
        before: () => {
            searchData = [];
        },
        each: (filename, file) => {
            debug("Processing: %s", filename);
            searchData.push(buildSearchData(file, filename, options));
        },
        match: options.match,
        matchOptions: options.matchOptions,
        name: "metalsmith-simple-search"
    });
};


/**
 * Converts one big string into a space separated list of keywords.
 *
 * All keywords are converted to lowercase, are cleaned up a bit and
 * are deduplicated.
 *
 * @example
 * console.log(simpleSearch.makeKeywords("One two THREE"));
 * // "one three two"
 *
 * @example
 * console.log(simpleSearch.makeKeywords("Hi! ONE*two, pro- and ani- (whatever)"));
 * // "and anti hi one pro two whatever"
 *
 * @param {string} str
 * @return {string}
 */
module.exports.makeKeywords = (str) => {
    var map, words;

    // Add a space before and after the string so matching functions
    // can all use similar anchors.
    str = ` ${str} `;

    // Replace all newlines and whitespace with a single space. This speeds
    // up the later looping over each word.
    str = str.replace(/([ \n\r\t]|\s)+/g, " ");

    // Treat this punctuation as word separators
    str = str.replace(/[\\$!?|`.,;:()<>{}#*@/="[\]]/g, " ");

    // Change the content into a list of words by removing punctuation
    // from the left and right.
    str = str.replace(/ [-+_']+/g, " ");
    str = str.replace(/[-+_']+ /g, " ");

    // Change to lowercase to reduce the number of keywords due to their
    // capitalization.
    str = str.toLowerCase();

    // Change into a list of words. Use an object as a map.
    map = {};
    str.split(/ +/).forEach((word) => {
        if (word) {
            map[word] = true;
        }
    });
    words = Object.keys(map).sort();

    // Filter out non-words. This requires a letter or number in the string
    // in order to be kept.
    words = words.filter((word) => {
        return word.match(/[a-z0-9]/);
    });

    // Convert back to a single string.
    return words.join(" ");
};


/**
 * Remove HTML from some text. Adds a space wherever a tag was found.
 * Multiple spaces together are condensed into one and the resulting string
 * is also trimmed.
 *
 * @example
 * console.log(simpleSearch.stripHtml("<p>Paragraph</p>");
 * // "Paragraph"
 *
 * @example
 * console.log(simpleSearch.stripHtml("<div>This <i>is</i> <b>bold</b>.</div><div>hi</div>"));
 * // "This is bold . hi"
 *
 * @example
 * console.log(simpleSearch.stripHtml("Arrow --&gt;"));
 * // "Arrow -->"
 *
 * @param {string} str
 * @return {string}
 */
module.exports.stripHtml = (str) => {
    str = striptags(str, null, " ");
    str = unescape(str);
    str = str.replace(/\s\s+/g, " ").trim();

    return str;
};


/**
 * Remove markdown from some text. This does not convert Markdown. Instead,
 * the goal is to only remove links from the text so the URLs don't get
 * indexed.
 *
 * @example
 * console.log(simpleSearch.stripMarkdown("a [link](example.com)"));
 * // "a link"
 *
 * @example
 * console.log(simpleSearch.stripMarkdown("[link]: example.com"));
 * // ""
 *
 * @param {string} str
 * @return {string}
 */
module.exports.stripMarkdown = (str) => {
    // Remove link definitions from markdown style text. These are where
    // a link is defined and is not embedded in text. Like this:
    // [link text]: http://example.com
    str = str.replace(/^\s*\[[^\]]*\]:.*$/gm, "");

    // Remove markdown links within text, but keep the link text.
    // blah blah [link](http://example.com) blah
    // blah blah [link][link reference] blah
    // blah blah [link] blah
    str = str.replace(/\[([^\]]*)\](\[[^\]]*\]|\([^)]*\))?/g, "$1");

    return str;
};
