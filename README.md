# jinplace jquery plugin 

## Description

This is a plugin for jQuery for in-place editing of data on the page.
The intended way to use it is for the editable fields on the web
page to be marked up with HTML data-* attributes.
The plugin call can be placed in a page template and when it runs
it finds all the fields that have been marked as editable.

Alternatively you can specify all options in the plugin call, or a
mixture of the two depending on your needs.

## About 

* [Live demo](https://bitbucket.org/itinken/jinplace/wiki/demo.html)
* [Downloads](https://bitbucket.org/itinken/jinplace/downloads)
* [Source](https://bitbucket.org/itinken/jinplace/src)
* [Documentation](https://bitbucket.org/itinken/jinplace/wiki/Documentation)

## Basic usage 

Basic usage is to first inlucde the javascript file

```html
  <script src="js/jinplace.js"></script>
```

Then mark up the elements that you wish to be editable using
the jinplace data-* attributes.
At minimum you need only add a suitable class (or id) and the url to submit the data to.

```html
  <span class="editable" data-url="/api/modify/987/name">Fred</span>
```

Finally initialise the plugin selecting all the elements you want
to be editable.

```javascript
 $('.editable').jinplace();
```

For many more examples see the [online demo](https://bitbucket.org/itinken/jinplace/wiki/demo.html)
and the [documentation](https://bitbucket.org/itinken/jinplace/wiki/Documentation)

### See also

Some alternative solutions are

* [jeditable](http://www.appelsiini.net/projects/jeditable)
* [best\_in\_place](https://github.com/bernat/best_in_place)
