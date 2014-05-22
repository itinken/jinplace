# The jinplace jQuery plugin 

## Description

This is a plugin for jQuery for in-place editing of data on the page.
The intended way to use it is for the editable fields on the web
page to be marked up with HTML data-* attributes.
The plugin call can be placed in a page template and when it runs
it finds all the fields that have been marked as editable.

Alternatively you can specify all options in the plugin call, or a
mixture of the two depending on your needs.

## About 

* [Live demo](http://jinplace.org/demo.html)
* [Downloads](https://bitbucket.org/itinken/jinplace/downloads)
* [Source](https://bitbucket.org/itinken/jinplace/src)
* [Documentation](https://bitbucket.org/itinken/jinplace/wiki/Documentation)

## Features 

* Primarily driven by markup on the page.
* Can also use javascript configuration.
* Framework independent.
* Works with IE6-8 and all modern browsers, including mobile.
* Directly supports text, textarea and select fields.
* Other kinds of input editors can be written as plugins
see [jinplace-extra](https://bitbucket.org/itinken/jinplace-extra)
(or [github mirror](https://github.com/itinken/jinplace-extra))
* Text like editing fields can optionally have OK and Cancel buttons
with configurable text.
* Data to be edited can be supplied as an attribute of the element,
rather than using the existing text within the element.
* Data to be edited can be retrieved from the server just before
editing.
* The object to be edited can be identified in a variety of ways.
* Any element can be used to activate the edit field, by default it
will be the element itself.

## Basic usage 

You need to include the jQuery file and the jinplace file.

```html
  <!-- Adjust depending on where you have located the files -->
  <script src="/js/jquery.js"></script>
  <script src="/js/jinplace.js"></script>
```

Then mark up the elements that you wish to be editable using the
jinplace data-* attributes. At minimum you need only add a suitable
class (or id) and the url to submit the data to.

```html
  <span class="editable" data-url="/api/modify/987/name">Fred</span>
```

Finally initialise the plugin selecting all the elements you want
to be editable. The following example selects all elements that have
class 'editable' and applies the plugin to them.

```javascript
 $('.editable').jinplace();
```

For many more examples see the [online demo](http://jinplace.org/demo.html)
and the [documentation](https://bitbucket.org/itinken/jinplace/wiki/Documentation)

### See also

Some similar jQuery plugins for in place editing.

* [jeditable](http://www.appelsiini.net/projects/jeditable) Uses
javascript configuration only. Although you can use jinplace in this
manner, you may find that if you don't want to use markup
configuration then jeditable may be more suitable for you as it has
more configuration possibilities.
* [best_in_place](https://github.com/bernat/best_in_place) Does
in-place editing using markup to indicate the editable areas. It
is part of a ruby on rails project and is somewhat tied to it. Can
easily modify to work with any framework though. If you are using
rails, then it may well suit your needs.
