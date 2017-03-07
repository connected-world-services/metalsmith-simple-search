"use strict";

var minimatch, path, striptags;

minimatch = require("minimatch");
path = require("path");
striptags = require("striptags");


/**
 * Remove markdown from some text
 *
 * @param {string} str
 * @return {string}
 */
function stripMarkdown(str) {
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
}


/**
 * Converts one big string into a space separated list of keywords.
 *
 * All keywords are converted to lowercase, are cleaned up a bit and
 * are deduplicated.
 *
 * @param {string} str
 * @return {string}
 */
function makeKeywords(str) {
    var map, words;

    // Add a space before and after the string so matching functions
    // can all use similar anchors.
    str = ` ${str} `;

    // Replace all newlines and whitespace with a single space. This speeds
    // up the later looping over each word.
    str = str.replace(/([ \n\r\t]|\s)+/g, " ");

    // Treat this punctuation as word separators
    str = str.replace(/[()<>{}/=."]/g, " ");

    // Change the content into a list of words by removing punctuation
    // from the left and right.
    str = str.replace(/ [-_,`:;'\\$?*#!@]+/g, " ");
    str = str.replace(/[-_,`:;'\\$?*#!@]+ /g, " ");

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
}


module.exports = (options) => {
    var jsPath, matcher;

    /**
     * Creates the metadata for a single file object.
     *
     * @param {Object} file
     * @param {string} filename
     * @return {Object} search data
     */
    function buildSearchData(file, filename) {
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

            // Clean up the data and convert to a list of keywords.
            value = cleansingFn(value);
            value = makeKeywords(value);
            result[metadataName] = value;
        });

        // Assign the .url property
        result.url = options.transformUrl(filename);

        return result;
    }

    options = options || {};
    options.destinationJson = options.destinationJson || "search.json";
    options.destinationJs = options.destinationJs || "simple-search.min.js";
    options.index = options.index || {
        title: true,
        keywords: true,
        contents: "html"
    };
    options.match = options.match || "**/*.{htm,html}";
    options.matchOptions = options.matchOptions || {};
    options.transformUrl = options.transformUrl || ((filename) => {
        return `/${filename}`;
    });

    // Convert the index definitions to functions.
    Object.keys(options.index).forEach((metadataName) => {
        var value;

        value = options.index[metadataName];

        if (!value || typeof value === "function") {
            return;
        }

        if (value === "html") {
            value = striptags;
        } else if (value === "markdown" || value === "md") {
            value = stripMarkdown;
        } else {
            value = (str) => {
                return str;
            };
        }

        options.index[metadataName] = value;
    });

    jsPath = path.resolve(__dirname, "..", "asset", "jekyll-search.min.js");
    matcher = new minimatch.Minimatch(options.match, options.matchOptions);

    return (files, metalsmith, done) => {
        var searchData;

        // Build metadata
        searchData = [];
        Object.keys(files).forEach((filename) => {
            if (matcher.match(filename)) {
                searchData.push(buildSearchData(files[filename], filename));
            }
        });

        // Save search metadata to files object
        files[options.destinationJson] = {
            contents: Buffer.from(JSON.stringify(searchData), "utf8"),
            mode: "0644"
        };

        // Load JS and save on files object
        files[options.destinationJs] = metalsmith.readFile(jsPath);
        done();
    };
};

module.exports.makeKeywords = makeKeywords;
module.exports.stripMarkdown = stripMarkdown;
