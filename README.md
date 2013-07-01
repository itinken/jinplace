
# jinplace jquery plugin 

## Description

This is a plugin for jQuery for in-place editing of data on the page.
Html markup is used to annotate the elements to be edited.

```javascript
var j;
j = 2 + 4;
$('.editable').jinplace();
```

### See also

Some alternative solutions are

* jeditable
* best\_in\_place

## data attributes 

**data-type** : The input field type to be created which can be
input, textarea or select.

**data-url** : The url to post the result to

**data-data** : 

**data-loadurl** : 

**data-object-name** : 

**data-attribute** : 

**data-ok-button** : 

**data-cancel-button** : 

**data-input-class** : 

**data-activator** : 

**data-text-only** : 

**data-nil** : 

## Features

* Editing can be activated by clicking on the text or a separate button.
* Optional OK and Cancel buttons with configurable text
* Textareas autogrow

## Posting to server 

The item to be modified on the server can be identified by any of the
following attributes on the edited element.

* data-url
* id
* data-object-name
* data-attribute
