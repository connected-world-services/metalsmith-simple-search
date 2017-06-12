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


Usage
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
                "matchOptions": {},
                "skipSearchJs": false
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
        // in a browser. Disable with the `skipSearchJs` setting.
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
        matchOptions: {},

        // If true, do not write the `destinationJs` to the output files.
        // When switching this on, make sure the "simple-search.min.js" file
        // is somehow included in your build.
        skipSearchJs: false,

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
* `true` - Index this property. If the value is an object, call `.toString()` on it first. If the value is an array, join with `" "`. Once it is a text string, index this as-is.
* `"html"` - Convert the value to a string then remove all HTML tags and unescape any escaped content. This means `<div class="xyz">text</div>` turns into `text` (HTML elements removed). The HTML is scanned for changed to lowercase, made into a list of keywords and duplicates are removed.
* `"markdown"` or `"md"` - Assume the value is markdown and remove some non-text markup. The markdown is changed to lowercase, made into a list of keywords and duplicates are removed.
* `"keywords"` - Change the text into lowercase, make it into a list of keywords and remove duplicates.
* `outStr = function (inStr)` - A custom function of your own that will take the string value of this metadata and convert it into a cleansed version.

You need to also use the `browser/jekyll-search.js` or `browser/jekyll-search.min.js` in the browser and configure it. Those files are included in this repository. To configure it you will need to execute some JavaScript on page load. Please see the [Simple Jekyll Search] site or the [browser/README.md](browser/README.md) file for great instructions on how to finish setting this up.

The only reason the `browser/` files exist in this repository is because the `jekyll-simple-search` npm module pulls in far too many dependencies (like gulp) during installation. I only want one build system, please.


Full API
--------

<a name="module_metalsmith-simple-search"></a>

## metalsmith-simple-search
Metalsmith Simple Search plugin to allow client-side searching of a site.

Uses the JavaScript from a similar project that lets you search
[Jekyll sites](https://github.com/christian-fei/Simple-Jekyll-Search)
as the driver behind the searching.

**See**: [https://github.com/christian-fei/Simple-Jekyll-Search](https://github.com/christian-fei/Simple-Jekyll-Search)  
**Example**  
```js
var simpleSearch = require("metalsmith-simple-search");

// Create your metalsmith instace. When that is done, add the middleware
// like this.
metalsmith.use(simpleSearch({
    // configuration here
}));
```

* [metalsmith-simple-search](#module_metalsmith-simple-search)
    * [module.exports(options)](#exp_module_metalsmith-simple-search--module.exports) ⇒ <code>function</code> ⏏
        * _static_
            * [.makeKeywords(str)](#module_metalsmith-simple-search--module.exports.makeKeywords) ⇒ <code>string</code>
            * [.stripHtml(str)](#module_metalsmith-simple-search--module.exports.stripHtml) ⇒ <code>string</code>
            * [.stripMarkdown(str)](#module_metalsmith-simple-search--module.exports.stripMarkdown) ⇒ <code>string</code>
        * _inner_
            * [~buildSearchData(file, filename, options)](#module_metalsmith-simple-search--module.exports..buildSearchData) ⇒ [<code>searchData</code>](#module_metalsmith-simple-search--module.exports..searchData)
            * [~metalsmithFile](#module_metalsmith-simple-search--module.exports..metalsmithFile) : <code>Object</code>
            * [~metalsmithFileCollection](#module_metalsmith-simple-search--module.exports..metalsmithFileCollection) : <code>Object.&lt;string, module:metalsmith-simple-search--module.exports~metalsmithFile&gt;</code>
            * [~searchData](#module_metalsmith-simple-search--module.exports..searchData) : <code>Object.&lt;string, string&gt;</code>
            * [~options](#module_metalsmith-simple-search--module.exports..options) : <code>Object</code>

<a name="exp_module_metalsmith-simple-search--module.exports"></a>

### module.exports(options) ⇒ <code>function</code> ⏏
The Simple Search factory.

**Kind**: Exported function  
**Returns**: <code>function</code> - middleware  
**Params**

- options [<code>options</code>](#module_metalsmith-simple-search--module.exports..options)

**Example**  
```js
var simpleSearch = require("metalsmith-simple-search");

// Make the metalsmith instance, then at the appropriate time, add this
// line.
metalsmith.use(simpleSearch({
    // options go here
}));
```
<a name="module_metalsmith-simple-search--module.exports.makeKeywords"></a>

#### module.exports.makeKeywords(str) ⇒ <code>string</code>
Converts one big string into a space separated list of keywords.

All keywords are converted to lowercase, are cleaned up a bit and
are deduplicated.

**Kind**: static method of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Params**

- str <code>string</code>

**Example**  
```js
console.log(simpleSearch.makeKeywords("One two THREE"));
// "one three two"
```
**Example**  
```js
console.log(simpleSearch.makeKeywords("Hi! ONE*two, pro- and ani- (whatever)"));
// "and anti hi one pro two whatever"
```
<a name="module_metalsmith-simple-search--module.exports.stripHtml"></a>

#### module.exports.stripHtml(str) ⇒ <code>string</code>
Remove HTML from some text. Adds a space wherever a tag was found.
Multiple spaces together are condensed into one and the resulting string
is also trimmed.

**Kind**: static method of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Params**

- str <code>string</code>

**Example**  
```js
console.log(simpleSearch.stripHtml("<p>Paragraph</p>");
// "Paragraph"
```
**Example**  
```js
console.log(simpleSearch.stripHtml("<div>This <i>is</i> <b>bold</b>.</div><div>hi</div>"));
// "This is bold . hi"
```
**Example**  
```js
console.log(simpleSearch.stripHtml("Arrow --&gt;"));
// "Arrow -->"
```
<a name="module_metalsmith-simple-search--module.exports.stripMarkdown"></a>

#### module.exports.stripMarkdown(str) ⇒ <code>string</code>
Remove markdown from some text. This does not convert Markdown. Instead,
the goal is to only remove links from the text so the URLs don't get
indexed.

**Kind**: static method of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Params**

- str <code>string</code>

**Example**  
```js
console.log(simpleSearch.stripMarkdown("a [link](example.com)"));
// "a link"
```
**Example**  
```js
console.log(simpleSearch.stripMarkdown("[link]: example.com"));
// ""
```
<a name="module_metalsmith-simple-search--module.exports..buildSearchData"></a>

#### module.exports~buildSearchData(file, filename, options) ⇒ [<code>searchData</code>](#module_metalsmith-simple-search--module.exports..searchData)
Creates the metadata for a single file object.

The `options` passed may have altered `options.index` values. Only booleans
and functions are supported. Strings were converted into functions in
the factory middleware.

**Kind**: inner method of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Returns**: [<code>searchData</code>](#module_metalsmith-simple-search--module.exports..searchData) - search data  
**Params**

- file [<code>metalsmithFile</code>](#module_metalsmith-simple-search--module.exports..metalsmithFile)
- filename <code>string</code>
- options [<code>options</code>](#module_metalsmith-simple-search--module.exports..options)

**Example**  
```js
result = {};
Object.keys(files).forEach((filename) => {
    result[filename] = buildSearchData(files[filename], filename, options);
});
```
<a name="module_metalsmith-simple-search--module.exports..metalsmithFile"></a>

#### module.exports~metalsmithFile : <code>Object</code>
Metalsmith's file object.

**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Properties**

| Name | Type |
| --- | --- |
| contents | <code>Buffer</code> | 
| mode | <code>string</code> | 

<a name="module_metalsmith-simple-search--module.exports..metalsmithFileCollection"></a>

#### module.exports~metalsmithFileCollection : <code>Object.&lt;string, module:metalsmith-simple-search--module.exports~metalsmithFile&gt;</code>
Metalsmith's collection of files.

**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
<a name="module_metalsmith-simple-search--module.exports..searchData"></a>

#### module.exports~searchData : <code>Object.&lt;string, string&gt;</code>
Data used for searching for a single file.

**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | Associated URL in case the search finds something. |

<a name="module_metalsmith-simple-search--module.exports..options"></a>

#### module.exports~options : <code>Object</code>
The options for the plugin.

**Kind**: inner typedef of [<code>module.exports</code>](#exp_module_metalsmith-simple-search--module.exports)  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| destinationJson | <code>string</code> | <code>&quot;search.json&quot;</code> | The location of the final JSON document. |
| destinationJs | <code>string</code> | <code>&quot;simple-search.min.js&quot;</code> | Where to add the associated JavaScript file. |
| index | <code>Object</code> | <code>{title:true,keywords:true,contents:&quot;html&quot;}</code> | Fields to index for searching. |
| match | <code>string</code> |  | Files to match, defaults to *.htm and *.html anywhere. |
| matchOptions | <code>Object</code> | <code>{}</code> | Additional options for filename matching. |
| skipSearchJs | <code>boolean</code> | <code>false</code> | If true, do not add the JavaScript to the output files. |
| transformUrl | <code>function</code> |  | Callback for converting a single file into a URL. Input is the filename, the returned string is the URL. |



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
