/** @preserve Copyright © 2013, Itinken Limited.
 * MIT Licence */
/*
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * See (http://jquery.com/).
 * @name jQuery
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 */

/**
 * See (http://jquery.com/)
 * @name fn
 * @class
 * See the jQuery Library  (http://jquery.com/) for full details.  This just
 * documents the function and classes that are added to jQuery by this plug-in.
 * @memberOf jQuery
 */

//noinspection JSUnnecessarySemicolon
;
//noinspection JSUnusedLocalSymbols
(function ($, window, document, undefined) {
	var pluginName = "jinplace";

	var option_list = ['type',
		'url',
		'data',
		'loadurl',
		'object',
		'attribute',
		'okButton',
		'cancelButton',
		'inputClass',
		'activator',
		'textOnly',
		'placeholder'
	];

	// Pairs of settings new,old.  We look for the old name and set the new.
	var fallbacks = [
		['placeholder', 'nil']  // will be removed at v1.0
	];

	/**
	 *
	 * @class jinplace
	 * @memberOf jQuery.fn
	 * @constructor
	 */
	function JinPlace(element, options) {
		var $el = this.element = $(element); // The editable element (often a span or div).

		if (options) {
			$.each(fallbacks, function (index, newold) {
				var new_name = newold[0];
				options[new_name] = options[new_name] || options[newold[1]];
			});
		}

		var elementOptions = this.elementOptions($el);

		var act = elementOptions.activator || element;
		elementOptions.activator = $(act);

		// So we have 1) options defined in defaults, 2) passed into the plugin, 3) set
		// on the element. Combine all these together.
		var opts = $.extend({},
				$.fn[pluginName].defaults,
				options,
				elementOptions);

		/**
		 * @type {{
		 *   type:!string,
		 *   url:string,
		 *   data:string,
		 *   loadurl:string,
		 *   object:string,
		 *   attribute:string,
		 *   okButton:string,
		 *   cancelButton:string,
		 *   inputClass:string,
		 *   activator:!object,
		 *   textOnly:boolean,
		 *   placeholder:string
		 * }}
		 */
		this.opts = opts;

		this.bindElement(opts);
	}

	JinPlace.prototype = {

		/**
		 * Get the options that are set on the editable element with the data-* attributes.
		 *
		 * @param $el The element that is being made editable.
		 */
		// Options are set using data- attributes of the element.
		elementOptions: function ($el) {
			var opts = {};
			function upperToHyphenLower(match) {
				return '-' + match.toLowerCase();
			}

			function make_attr_name(value) {
				return "data-" + value.replace(/[A-Z]/g, upperToHyphenLower);
			}

			$.each(option_list, function(index, value) {
				opts[value] = $el.attr(make_attr_name(value));
			});

			$.each(fallbacks, function (index, newold) {
				var new_name = newold[0];
				opts[new_name] = opts[new_name] || $el.attr(make_attr_name(newold[1]));
			});

			opts.textOnly = opts.textOnly === true || opts.textOnly !== 'false';
			return opts;
		},

		bindElement: function(opts) {
			// Remove any existing handler we set and bind to the activation click handler.
			opts.activator
					.off('click.jip')
					.on('click.jip', $.proxy(this.clickHandler, this));

			// If there is no content, then we replace it with the empty indicator.
			var $el = this.element;
			if ($.trim($el.html()) == "")
				$el.html(opts.placeholder);
		},

		/**
		 * Handle a click that is activating the element.  This click can be on any element
		 * so is not directly useful.  Things are always set up so that 'this' is this object
		 * and not the element that the click occurred on.
		 *
		 * @param ev The event.
		 */
		clickHandler: function(ev) {
			ev.preventDefault();
			ev.stopPropagation();

			// Turn off the activation handler, and disable any effect in case the activator
			// was a button that might submit.
			$(ev.currentTarget)
					.off('click.jip')
					.on('click.jip', function(ev) {
						ev.preventDefault();
					});

			var self = this,
					opts = self.opts;

			// A new editor is created for every activation. So it is OK to keep instance
			// data on it.
			var editor = $.fn[pluginName].editors[opts.type];
			editor = $.extend({}, editorBase, editor);

			// Save original for use when cancelling.
			self.origValue = self.element.html();

			self.fetchData(opts).done(function(data) {

				var field = editor.makeField(self.element, data);
				if (!editor.inputField)
					editor.inputField = field;
				field.addClass(opts.inputClass);

				var form = createForm(opts, field, editor.buttonsAllowed);

				// Add the form to the element to be edited
				self.element.html(form);

				// Now we can setup handlers and focus or otherwise activate the field.

				form
						.on("jip:submit submit", function(ev) {
							self.submit(editor, opts);
							return false;
						})
						.on("jip:cancel", function(ev) {
							self.cancel();
							return false;
						})
						.on("keyup", function(ev) {
							if (ev.keyCode == 27) {
								self.cancel();
							}
						});

				editor.activate(form, field);

				// The action to take on blur can be set on the editor.  If not, and there
				// are automatically added buttons, then the blur action is set according to
				// which ones exist. By default nothing happens on blur.
				var act = editor.blurAction || (
						(!opts.okButton)? 'submit':
								(!opts.cancelButton)? 'jip:cancel':
										undefined);
				editor.blurEvent(field, form, act);
			});
		},

		/**
		 * Get the parameters that will be sent in the ajax call to the server.
		 * Called for both the url and loadurl cases.
		 * @param opts The options from the element and config settings.
		 * @param value The value of the control as returned by editor.value().
		 * @returns {{id: string, object: *, attribute: *}}
		 */
		requestParams: function(opts, value) {
			var self = this;
			var params = { "id": self.element.id,
				"object": opts.object,
				attribute: opts.attribute
			};

			if (typeof value == 'string') {
				params.value = value;
			} else if ($.isPlainObject(value)) {
				$.extend(params, value);
			}

			return params;
		},

		/**
		 * Fetch the data that will be placed into the editing control.  The data is
		 * obtained from the following sources in this order:
		 * 1. data-data (or options.data)
		 * 2. data-loadurl (or options.loadurl) a request is made to the given url and the
		 *    resulting data is used.
		 * 3. The existing contents of 'element'.
		 */
		fetchData: function(opts) {
			var data, self = this;
			if (opts.data) {
				data = opts.data;

			} else if (opts.loadurl) {
				data = $.ajax(opts.loadurl, {
					data: this.requestParams(opts, undefined),
					context: self
				});

			} else {
				data = $.trim(this.element.html());
			}

			var placeholderFilter = function (data) {
				if (data == opts.placeholder)
					return '';
				return data;
			};

			var when = $.when(data);
			if (when.pipe) {
				return when.pipe(placeholderFilter);
			} else {
				return when.then(placeholderFilter);
			}
		},

		/**
		 * Throw away any edits and return the element to its original text.
		 */
		cancel: function() {
			var self = this;
			self.element.html(self.origValue);

			// Rebind the element for the next time
			self.bindElement(self.opts);
		},

		/**
		 * Called to submit the changed data to the server.
		 *
		 * This method is always called with 'this' set to this object.
		 */
		submit: function (editor, opts) {
			var self = this;
			$.ajax(opts.url, {
				type: "post",
				data: self.requestParams(opts, editor.value()),
				dataType: 'text',
				context: self,
				error: self.cancel
			})
					.done(function(data) {
						this.onUpdate(editor.displayValue(data));
					});
		},

		/**
		 * The server has received our data and replied successfully and the new data to
		 * be displayed is available.
		 * @param data The data to display from the server.
		 */
		onUpdate: function(data) {
			var self = this;
			self.setContent(data);
			self.bindElement(self.opts);
		},

		/**
		 * Set the content of the element.  Called to update the value from the value
		 * returned by the server.
		 *
		 * @param data The data to be displayed, it has been converted to the display format.
		 */
		setContent: function(data) {
			var element = this.element;

			if (!data)
				data = this.opts.placeholder;

			if (this.opts.textOnly) {
				element.text(data);
			} else {
				element.html(data);
			}
		}

	};

	// A really lightweight plugin wrapper around the constructor,
	// preventing against multiple instantiations
	$.fn[pluginName] = function (options) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName, new JinPlace(this, options));
			}
		});
	};

	// These are the plugin defaults. You can override these if required.
	$.fn[pluginName].defaults = {
		url: document.location.pathname,
		type: "input",
		textOnly: true,
		placeholder: '[ --- ]'
	};

	/**
	 * Create a form for the editing area.  The input element is added and if buttons
	 * are required then they are added. Event handlers are set up.
	 *
	 * @param opts The options for this editor.
	 * @param inputField The newly created input field.
	 * @param {boolean} [buttons] True if buttons can be added.  Whether buttons really are added
	 * depends on the options and data-* attributes.
	 * @returns {jQuery} The newly created form element.
	 */
	var createForm = function (opts, inputField, buttons) {
		var form = $("<form>")
				.attr("style", "display: inline;")
				.attr("action", "javascript:void(0);")
				.append(inputField);

		if (buttons)
			addButtons(form, opts);

		return form;
	};

	/**
	 * Add any requested buttons to the output.
	 *
	 * @param form The form that is being created.
	 * @param opts The options set for this editor.
	 */
	var addButtons = function (form, opts) {
		var setHandler = function (button, action) {
			form.append(button);
			button.one('click', function(ev) {
				ev.stopPropagation();
				form.trigger(action);
			});
		};

		var ok = opts.okButton;
		if (ok) {
			var $button = $("<input>").attr("type", "button").attr("value", ok)
					.addClass('jip-button jip-ok-button');
			setHandler($button, 'submit');
		}

		var cancel = opts.cancelButton;
		if (cancel) {
			$button = $("<input>").attr("type", "button").attr("value", cancel)
					.addClass('jip-button jip-cancel-button');
			setHandler($button, 'jip:cancel');
		}
	};

	/**
	 * This is the interface of an editor function. Plugins need only redefine the methods
	 * or data that are appropriate.
	 */
	var editorBase = {
		/**
		 * Are we allowed to automatically add buttons to the form. Set this to
		 * true for a text input where it might make sense.  They are only added
		 * if the user asks for them in any case.
		 *
		 buttonsAllowed: false,

		 */

		/**
		 * The input field returned by makeField() will be saved as this.inputField unless
		 * it is set within the makeField() method itself.
		 *
		 inputField: undefined,

		 */

		/**
		 * @name blurAction
		 * @memberOf editorBase
		 */

		/**
		 * Make the editing field that will be added to the form. Editing field is
		 * a general term; it could be a complex control or just a plain <input>.
		 *
		 * You may set this.inputField within the body of this method, if you do
		 * not then it will be set to the value you return.
		 *
		 * @param {jQuery} element The original element that we are going to edit.
		 * @param {string|Object} data The initial data that should be used to initialise the
		 * field.  For text inputs this will be just text, but for other types of
		 * input it may be an object specific to that field.
		 * @returns The new field wrapped in a jquery object.
		 */
		makeField: function (element, data) {
			// This is an implementation for <input type="text">. You would almost
			// always need to override this.
			return $("<input>")
					.attr("type", "text")
					.val(data);
		},

		/**
		 * Activate the field. It is now part of the document.
		 *
		 * Set up events as required.  You should ensure that the events 'jip:submit' or
		 * 'jip:cancel' are triggered on the form to submit the field or to cancel the
		 * edit as appropriate.
		 *
		 * You can use 'submit' instead of 'jip:submit' to take advantage of standard
		 * form processing.
		 *
		 * The default implementation is only useful for straight-forward text inputs.
		 *
		 * @param {jQuery} form The form your editor is contained in. If you want to avoid
		 * events bubbling up, you can stop them here.
		 * @param {jQuery} field The editing field.  Passed as a convenience so we don't have
		 * to save it.
		 */
		activate: function (form, field) {
			field.focus();
		},

		/**
		 * The value of the editor. This is the value returned by the input field
		 * or component that should be sent to the server.
		 *
		 * The default implementation just calls .val() on the inputField.
		 *
		 * @returns {string} The value that should be submitted to the server for this editor.
		 */
		value: function () {
			return this.inputField.val();
		},

		/**
		 * We are just about to remove the edit control and we have data returned from
		 * the server. This method converts the server form of the data into the on page
		 * value.
		 *
		 * The default implementation returns the data unchanged, which is suitable
		 * for a text input.
		 *
		 * For a select list, you might have [['1', 'blue'], ['2', 'green']]; if the server
		 * returns '2', then you return 'green' from this method.
		 *
		 * @param data The data as returned by the server which is to be used to populate
		 * the page after the edit control is removed.
		 * @returns {*} The data modified in any way that is appropriate.
		 */
		displayValue: function (data) {
			return data;
		},

		/**
		 * This is not a method to be overridden. Used to set up blur event handlers
		 * when you want the blur to be cancelled if there is a click on the control
		 * or any of its components as will usually be the case.
		 *
		 * @param {jQuery} blurElement This is the element to set the blur handler on.
		 * @param {jQuery} cancelElement These elements will cancel the blur action when clicked.
		 * @param {string} action The action to take on blur. This will be 'submit' or 'jip:cancel'.
		 * Can be set to 'ignore' to ensure that it is ignored and default values do not
		 * get used.
		 */
		blurEvent: function (blurElement, cancelElement, action) {
			if (!action || action == 'ignore') return;

			var onBlur = function (ev) {
				var t = setTimeout(function () {
					blurElement.trigger(action);
				}, 300);

				// If a click occurs on these elements, then the blur is cancelled.
				cancelElement.on('click', function () {
					clearTimeout(t);
				});
			};

			// Set the handler to our wrapper.
			blurElement.on('blur', onBlur);
		}
	};

	// The base implementation that can be extended. This is normally handled automatically.
	$.fn[pluginName].editorBase = editorBase;

	// The field editors can be overridden or added to
	$.fn[pluginName].editors = {

		/**
		 * A regular text input field.  All methods inherit from the base 'class'.
		 */
		input: {
			buttonsAllowed: true
		},

		/**
		 * A multi-line text area field.
		 */
		textarea: {
			buttonsAllowed: true,

			makeField: function (element, data) {
				var field = $("<textarea>")
						.css({
							'min-width': element.width(),
							'min-height': element.height()
						})
						.html(data);


				if (field.elastic)
					field.elastic();

				return field;
			}
		},

		/**
		 * A selection.  This is slightly more complex as we have to pass in the possible
		 * values so that one can be selected.
		 */
		select: {
			makeField: function (element, data) {
				var field = $("<select>"),
						choices = $.parseJSON(data);

				var selected = false;
				var elementChoice = null;
				$.each(choices, function(index, value) {
					var opt = $("<option>").val(value[0]).html(value[1]);
					if (value[2]) {
						opt.attr("selected", "1");
						selected = true;
					}
					if (value[1] == element.text())
						elementChoice = opt;
					field.append(opt);
				});

				// If we didn't get any indication of the selected element from the
				// given data, then use the match we found with the element text.
				if (!selected && elementChoice)
					elementChoice.attr("selected", "1");

				// Save the choices so we can decode the response.
				this.choices = choices;

				return field;
			},

			activate: function(form, field) {
				field.focus();
				field.on('change', function() {
					field.trigger('jip:submit');
				});
			},

			displayValue: function(data) {
				var display = '';
				$.each(this.choices, function(index, value) {
					if (data == value[0]) {
						display = value[1];
						return false;
					}
					return true;
				});
				return display;
			}
		}
	};
})(jQuery, window, document);

