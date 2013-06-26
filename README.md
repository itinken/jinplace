
# jinplace jquery plugin 

## Description

This is a plugin for jQuery for in-place editing of data on the page.
Html markup is used to annotate the elements to be edited.

### See also

Some alternative solutions are

* jeditable
* best_in_place

## data attributes 
<dl>
<dt> data-type
<dd>The input field type to be created which can be input, textarea or select.
<dt> data-url
<dt> data-data
<dt> data-loadurl
<dt> data-object-name
<dt> data-attribute
<dt> data-ok-button
<dt> data-cancel-button
<dt> data-input-class
<dt> data-activator
<dt> data-text-only
<dt> data-nil
</dl>

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
