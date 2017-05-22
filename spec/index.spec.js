"use strict";

var plugin;

/**
 * Call the plugin with the simulated files object.
 *
 * @param {Object} [config]
 * @param {Object} [files]
 * @return {Promise.<Object>} files
 */
function runPluginAsync(config, files) {
    return new Promise((resolve, reject) => {
        if (!files) {
            files = {
                ".archive/dot.html": {
                    contents: Buffer.from("Hidden File", "utf8")
                },
                "index.html": {
                    contents: Buffer.from("Main Index", "utf8"),
                    keywords: [
                        "awesome",
                        "amazing"
                    ],
                    title: "Main index"
                },
                "toc.htm": {
                    otherMetadata: "this is more metadata",
                    contents: Buffer.from("Table of contents", "utf8"),
                    url: "WRONG - this should be overwritten"
                },
                "search.php": {
                    contents: Buffer.from("A PHP script?")
                }
            };
        }

        plugin(config)(files, null, (err) => {
            if (err) {
                reject(err);
            } else {
                // Convert Buffer objects to strings for easier test
                // comparisons.
                Object.keys(files).forEach((filename) => {
                    files[filename].contents = files[filename].contents.toString("utf8");
                });
                resolve(files);
            }
        });
    });
}


/**
 * Run the plugin and get the list of files indexed in the search
 * JSON.
 *
 * @param {Object} [config]
 * @return {Promise.<Array.<string>>}
 */
function getSearchHitsAsync(config) {
    return runPluginAsync(config).then((files) => {
        files = files["search.json"].contents.toString("utf8");
        files = JSON.parse(files);
        files = files.map((item) => {
            return item.url;
        }).sort();

        return files;
    });
}


/**
 * Convert an array into an object by using the "url" property as the
 * object's key.
 *
 * @param {Array.<Object>} arr
 * @return {Object}
 */
function convertToObject(arr) {
    var result;

    result = {};
    arr.forEach((val) => {
        result[val.url] = val;
    });

    return result;
}


/**
 * Compare the search buffer versus what is expected. This actually
 * takes arrays on both sides and converts them to objects keyed by the
 * url so the comparison doesn't depend on the order of properties
 * scanned in the file object.
 *
 * @param {Object} file Generated file from plugin
 * @param {Array.<Object>} expected Desired search results
 */
function compareSearch(file, expected) {
    var actual;

    expected = convertToObject(expected);
    actual = convertToObject(JSON.parse(file.contents));
    expect(actual).toEqual(expected);
}


plugin = require("..");

describe("metalsmith-simple-search", () => {
    describe("options.destinationJson", () => {
        it("writes to 'search.json'", () => {
            return runPluginAsync().then((files) => {
                compareSearch(files["search.json"], [
                    {
                        contents: "index main",
                        keywords: "awesome amazing",
                        title: "Main index",
                        url: "/index.html"
                    },
                    {
                        contents: "contents of table",
                        url: "/toc.htm"
                    }
                ]);
                expect(files["search-thing.json"]).not.toBeDefined();
            });
        });
        it("can write to another file", () => {
            return runPluginAsync({
                destinationJson: "search-thing.json"
            }).then((files) => {
                compareSearch(files["search-thing.json"], [
                    {
                        contents: "index main",
                        keywords: "awesome amazing",
                        title: "Main index",
                        url: "/index.html"
                    },
                    {
                        contents: "contents of table",
                        url: "/toc.htm"
                    }
                ]);
                expect(files["search.json"]).not.toBeDefined();
            });
        });
    });
    describe("options.destinationJs", () => {
        it("includes 'simple-search.min.js'", () => {
            return runPluginAsync().then((files) => {
                expect(files["simple-search.min.js"]).toEqual({
                    contents: jasmine.any(Object),
                    mode: "0644"
                });
                expect(files["search.js"]).not.toBeDefined();
            });
        });
        it("can write to another file", () => {
            return runPluginAsync({
                destinationJs: "search.js"
            }).then((files) => {
                expect(files["search.js"]).toEqual({
                    contents: jasmine.any(Object),
                    mode: "0644"
                });
                expect(files["simple-search.min.js"]).not.toBeDefined();
            });
        });
    });
    describe("options.index", () => {
        // Default options (title/keyword/contents) are already in other tests.
        it("can index any metadata and overwrites any url property", () => {
            return runPluginAsync({
                index: {
                    otherMetadata: true,
                    url: true
                }
            }).then((files) => {
                compareSearch(files["search.json"], [
                    {
                        url: "/index.html"
                    },
                    {
                        otherMetadata: "this is more metadata",
                        url: "/toc.htm"
                    }
                ]);
            });
        });
        it("is allowed to use a custom cleansing function", () => {
            return runPluginAsync({
                index: {
                    contents: "markdown",
                    title: (str) => {
                        return `modified${str}modified`;
                    }
                }
            }).then((files) => {
                compareSearch(files["search.json"], [
                    {
                        contents: "index main",
                        title: "modifiedMain indexmodified",
                        url: "/index.html"
                    },
                    {
                        contents: "contents of table",
                        url: "/toc.htm"
                    }
                ]);
            });
        });
    });
    describe("options.match", () => {
        it("matches *.htm and *.html by default", () => {
            return getSearchHitsAsync().then((files) => {
                expect(files).toEqual([
                    "/index.html",
                    "/toc.htm"
                ]);
            });
        });
        it("matches anything you like", () => {
            return getSearchHitsAsync({
                match: "**/*.php"
            }).then((files) => {
                expect(files).toEqual([
                    "/search.php"
                ]);
            });
        });
    });
    describe("options.matchOptions", () => {
        // The default has been tested repeatedly with the hidden file.
        it("can include hidden files", () => {
            return getSearchHitsAsync({
                matchOptions: {
                    dot: true
                }
            }).then((files) => {
                expect(files).toEqual([
                    "/.archive/dot.html",
                    "/index.html",
                    "/toc.htm"
                ]);
            });
        });
    });
    describe("options.skipSearchJs", () => {
        it("skips writing 'simple-search.min.js'", () => {
            return runPluginAsync({
                skipSearchJs: true
            }).then((files) => {
                expect(files["simple-search.min.js"]).not.toBeDefined();
            });
        });
        it("can write to another file", () => {
            return runPluginAsync({
                destinationJs: "search.js"
            }).then((files) => {
                expect(files["search.js"]).toEqual({
                    contents: jasmine.any(Object),
                    mode: "0644"
                });
                expect(files["simple-search.min.js"]).not.toBeDefined();
            });
        });
    });
    describe("options.transformUrl", () => {
        // The default adds a slash and that's been well tested.
        it("can change the URL in the generated JSON", () => {
            return getSearchHitsAsync({
                transformUrl: (filename) => {
                    return `/my-site/${filename}`;
                }
            }).then((files) => {
                expect(files).toEqual([
                    "/my-site/index.html",
                    "/my-site/toc.htm"
                ]);
            });
        });
    });
});
describe("metalsmithSimpleSearch.makeKeywords", () => {
    it("condenses whitespace", () => {
        expect(plugin.makeKeywords("a     b")).toEqual("a b");
    });
    it("removes punctuation from the edges of words", () => {
        expect(plugin.makeKeywords("\"Eat, drink, and be anonymous.\" --John Doe")).toEqual("and anonymous be doe drink eat john");
    });
    it("uses some characters as word separators", () => {
        expect(plugin.makeKeywords("int main(void)")).toEqual("int main void");
    });
    it("changes case to be lowercase", () => {
        expect(plugin.makeKeywords("A aB abC ABCD")).toEqual("a ab abc abcd");
    });
    it("removes duplicates", () => {
        expect(plugin.makeKeywords("one two one one two three one four")).toEqual("four one three two");
    });
});
describe("metalsmithSimpleSearch.stripHtml", () => {
    it("removes elements", () => {
        expect(plugin.stripHtml("<a href=\"test\">test link</a> here")).toEqual("test link here");
    });
    it("unescapes HTML", () => {
        expect(plugin.stripHtml("&lt;div&gt;&quot;Hi&apos;")).toEqual("<div>\"Hi'");
    });
});
describe("metalsmithSimpleSearch.stripMarkdown", () => {
    it("removes link targets from within text", () => {
        expect(plugin.stripMarkdown("one [link1](http://example.com) here")).toEqual("one link1 here");
    });
    it("removes referenced link targets", () => {
        expect(plugin.stripMarkdown("two [link two][second link] here")).toEqual("two link two here");
    });
    it("removes brackets from links defined elsewhere", () => {
        expect(plugin.stripMarkdown("three [link me] three")).toEqual("three link me three");
    });
    it("removes link definitions", () => {
        // The entire line containing the definition is removed.
        expect(plugin.stripMarkdown(`Some text here

[link def]: http://example.com

more text here`)).toEqual(`Some text here


more text here`);
    });
});
