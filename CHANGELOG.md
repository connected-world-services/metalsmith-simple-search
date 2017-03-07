CHANGELOG
=========


1.1.1 - 2017-03-07
------------------

* Using `fs.readFile` instead of `metalsmith.readFile` because the latter doesn't work well for me.


1.1.0 - 2017-03-07
------------------

* Improved HTML filter so escaped entities, such as `&quot;` are changed into their unescaped equivalents before being changed into the list of keywords.
* HTML unquoting now uses the unescape module.
* Changed word separator characters a bit.
* Sometimes you want to use the keyword filter and sometimes not. Changed the `index` property to reflect that.


1.0.0 - 2017-03-07
------------------

* Initial release.
