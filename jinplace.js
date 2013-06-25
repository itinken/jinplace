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
 *
 * The list of attributes that can be supplied on the editable element.
 *
 * data-url: This is the url that the result will be posted to. The default is the current
 *     location.
 *
 * data-type: One of input, select, textarea. Determines the kind of input control that will
 * be created.  The default is 'input'.
 *
 * data-data: This is the data to be edited if different from the contents of the element. For
 *     select elements this is a json representation of the data '[[1, "First"], [2, "Second"]..]
 *     The default is to use the text within the element. For a select control this must be
 *     supplied.
 *
 * data-loadurl: Data is loaded from this url for editing. Same as data-data, except the data
 *     is obtained from a remote location.  This is useful when you have wikitext,
 *     this can load the original data so it can be edited. On submit the html formated text
 *     will be returned.  If data-data is also supplied then it will be used and this attribute
 *     will be ignored.
 *
 * data-object: The name of the object to be modified. If given it is sent as part of the post
 *     request to the server.
 *
 * data-attribute: The name of the field in the object to be modified. It is sent to the
 *     server on update.
 *
 * data-text-only: if true (default) data will be treated as plain text.  Any html returned
 *     from the server will be displayed as is (ie with html escaped). HTML will not be
 *     submitted to the server.  The default is true.  When set to false, make sure there
 *     are no security issues.
 *
 * data-ok-button: An OK button is added that is used to submit the value.  The value of this
 *     attribute is the button text.
 *
 * data-cancel-button: Adds a cancel button with the given text.
 *
 * data-input-class: This css class will be attached to the input element that is created.
 *
 * data-activator: The id of the element to bind the click event to. If not given then clicking
 *     on the element itself activates the editor.
 *
 */
//noinspection JSUnnecessarySemicolon
; (function ($, window, document, undefined) {
	var pluginName = "jinplace";

	// The actual plugin constructor
	function JinPlace(element, options) {
		this.element = element;
		this.options = $.extend({}, $.fn[pluginName].defaults, options);

		this.init();
	}

	JinPlace.prototype = {

		init: function () {
			// call them like so: this.yourOtherFunction(this.element, this.options).
			this.initOptions($(this.element), this.options);
			this.bindElement();
		},

		/**
		 * Options have defaults in the standard jquery way and can also be set during
		 * the jinplace({ ..settings.. }) call.
		 *
		 * Mostly however options are set on the element using data-* attributes.
		 *
		 * @param $el The element that is being made editable.
		 * @param defaultOpts The default options.
		 */
		// Options are set using data- attributes of the element.
		initOptions: function ($el, defaultOpts) {
			var opts = {};
			opts.formType = $el.attr("data-type");
			opts.url = $el.attr("data-url");
			opts.data = $el.attr("data-data") || $el.attr("data-collection");
			opts.loadurl = $el.attr("data-loadurl");
			opts.objectName = $el.attr("data-object-name");
			opts.attribute = $el.attr("data-attribute");
			opts.okButton = $el.attr("data-ok-button");
			opts.cancelButton = $el.attr("data-cancel-button");
			opts.inputClass = $el.attr("data-input-class");
			opts.activator = $el.attr("data-activator") || $el;
			opts.activator = $(opts.activator);
			var only = $el.attr("data-text-only");
			if (only)
				opts.textOnly = only != 'false';
			opts.nil = $el.attr("data-nil");

			// All options are set as properties of this object, which is known as jip in
			// the form field editors.
			$.extend(this, defaultOpts, opts);

			this.element = $el;
			this.editor = $.fn[pluginName].editors[this.formType];

			if (opts.data && opts.formType == 'select')
				this.choiceValues = $.parseJSON(opts.data);
		},

		bindElement: function() {
			// Remove any existing handler we set and bind to the activation click handler.
			this.activator.off('click.jinplace');
			this.activator.on('click.jinplace', $.proxy(this.clickHandler, this));
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
			this.activator.off('click.jinplace')
					.on('click.jinplace', function(ev) { ev.preventDefault();});

			this.origValue = this.element.html();

			var self = this;
			this.fetchData().done(function(data) {
				self.editor.activate(self, data);
			});
		},

		requestParams: function(isSend) {
			var params = { "id": this.element.id,
				"object": this.objectName,
				attribute: this.attribute
			};

			if (isSend)
				params.value = this.inputField.val();

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
		fetchData: function() {
			var data, self = this;
			if (this.data) {
				data = this.data;

			} else if (this.loadurl) {
				data = $.ajax(this.loadurl, {
					data: this.requestParams(),
					context: self
				});

			} else {
				data = this.element.html();
			}

			return $.when(data).then(function(data) {
				if (data == self.nil)
					return '';
				return data;
			});
		},

		/**
		 * Called when an event occurs that cancels the edit.  The form is removed and the
		 * original text is placed back.
		 *
		 * The context is always set up so that 'this' is this object and not the object
		 * that caused the event.
		 *
		 * @param ev The event.
		 */
		cancelHandler: function(ev) {
			ev.preventDefault();
			ev.stopPropagation();

			this.cancel();
		},

		/**
		 * Throw away any edits and return the element to its original text.
		 */
		cancel: function() {
			this.element.html(this.origValue);
			this.bindElement();
		},

		/**
		 * Called to submit the changed data to the server.
		 *
		 * This method is always called with this set to this object.
		 *
		 * @param ev The event that caused us to be called. Not interesting to
		 * this routine, since it could be many different things.
		 */
		submitHandler: function (ev) {
			ev.preventDefault();
			$.ajax(this.url, {
				type: "post",
				data: this.requestParams(true),
				dataType: 'text',
				context: this,
				success: this.onUpdate,
				error: this.cancel});
		},

		/**
		 * The server has received our data and replied successfully and the new data to
		 * be displayed is available.
		 * @param data The data to display from the server.
		 */
		onUpdate: function(data) {
			this.setContent(data);
			this.bindElement();
		},

		/**
		 * Set the content of the element.  Called to update the value from the value
		 * returned by the server.
		 *
		 * The editors may have a getDisplay() method, that is used to modify the data
		 * before display.
		 *
		 * @param data The data to be displayed.
		 */
		setContent: function(data) {
			if (this.editor.getDisplay)
				data = this.editor.getDisplay(this);
			if (!data)
				data = this.nil;
			if (this.textOnly) {
				this.element.text(data);
			} else {
				this.element.html(data);
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
		formType: "input",
		data: null,
		loadurl: null,
		objectName: undefined,
		attributeName: undefined,
		activator: null,
		inputClass: '',
		okButton: null,
		cancelButton: null,
		textOnly: true,
		nil: '[ --- ]'
	};

	// The field editors can be overridden or added to
	$.fn[pluginName].editors = (function() {
		/**
		 * Create a form for the editing area.  The input element is added and if buttons
		 * are required then they are added. Event handlers are set up.
		 *
		 * @param jip The JinPlace object.
		 * @param inputField The newly created input field.
		 * @param {boolean} [buttons] True if buttons can be added.  Whether buttons really are added
		 * depends on the options and data-* attributes.
		 * @returns {jQuery} The newly created form element.
		 */
		var createForm = function(jip, inputField, buttons) {
			jip.inputField = inputField;

			var form = $("<form>")
					.attr("style", "display: inline;")
					.attr("action", "javascript:void(0);")
					.append(inputField);

			if (buttons)
				addButtons(jip, form);

			setupInput(jip, form, inputField);
			return form;
		};

		/**
		 * Add any requested buttons to the output.
		 *
		 * @param jip The main JinPlace object.
		 * @param form The form that is being created.
		 */
		var addButtons = function (jip, form) {
			if (jip.okButton) {
				var $button = $("<input>").attr("type", "submit").attr("value", jip.okButton);
				$button.click($.proxy(jip.submitHandler, jip));
				form.append($button);
			}

			if (jip.cancelButton) {
				$button = $("<input>").attr("type", "button").attr("value", jip.cancelButton);
				$button.click($.proxy(jip.cancelHandler, jip));
				form.append($button);
			}
		};

		/**
		 * The form has been added to the DOM, set up the input to receive focus and events.
		 *
		 * If there are no button, then blur has to save.
		 * If just OK button, then blur cancels
		 * If both buttons, then use the buttons to save and cancel only (safest option for areas).
		 *
		 * @param jip The main JinPlace object.
		 * @param $form The form we are creating.
		 * @param $field The field within the form.
		 */
		var setupInput = function(jip, $form, $field) {
			jip.element.html($form);

			// Focus the field
			$field.focus();

			/**
			 * A delayed blur handler.  When we click on a button, there will be a blur event
			 * from the field before the button click. Therefore we need to wait before calling
			 * the blur handler and cancel it if a click comes in first.
			 *
			 * @param handler The real blur handler that will be called.
			 */
			var delayedBlur = function(handler) {

				var onBlur = function (ev) {
					var t = setTimeout(function () {
						handler.call(jip, ev);
					}, 500);

					// Hook up all input fields within the element. This will include all the
					// buttons.  Also includes the text field, so you may be able to cancel
					// an inadvertent blur by quickly clicking back in the text. (No guarantees
					// though!).
					//
					// If a click occurs the the blur is cancelled.
					jip.element.on('click', 'input', function() {
						clearTimeout(t);
					});
				};

				// Set the handler to our wrapper.
				$field.on('blur', onBlur);
			};

			if (!jip.okButton) {
				delayedBlur(jip.submitHandler);
			} else if (!jip.cancelButton) {
				delayedBlur(jip.cancelHandler);
			}

			$form.submit($.proxy(jip.submitHandler, jip))
		};

		// Now follows the editing objects for each input type.
		//
		// Each object has the following methods.
		//
		// activate(jip, el)  Create the editing field and replace the original text with it.
		//   @param jip the JinPlace object
		//   @param el the element that is being made editable.
		//
		// getDisplay(jip)  (Optional) Get the displayable value of the field. If this
		// method does not exist then inputField.val() will be used.
		//    @param jip The JinPlace object.

		/**
		 * A regular text input field.
		 */
		this.input = {
			activate: function(jip, data) {
				var field = $("<input>")
						.attr("type", "input")
						.addClass(jip.inputClass)
						.val(data);
				createForm(jip, field, true);
			}
		};

		// A textarea field
		this.textarea = {
			activate: function (jip, data) {
				var el = jip.element,
						width = el.width(),
						height = el.height();

				var field = $("<textarea>")
						.addClass(jip.inputClass)
						.css({
							'min-width': width,
							'min-height': height
						})
						.html(data);

				createForm(jip, field, true);

				if (field.elastic)
					field.elastic();
			}
		};

		/**
		 * A selection.  This is slightly more complex as we have to pass in the possible
		 * values so that one can be selected.  The getDisplay() method converts from
		 * the option value to the option text that is displayed.
		 */
		this.select = {
			activate: function (jip, data) {
				var field = $("<select>").addClass(jip.inputClass),
						choiceValues = $.parseJSON(data);

				$.each(choiceValues, function(index, value) {
					var opt = $("<option>").val(value[0]).html(value[1]);
					if (value[1] == jip.element.text())
						opt.attr("selected", "1");
					field.append(opt);
				});

				createForm(jip, field);
				field.on('change', $.proxy(jip.submitHandler, jip));
			},

			getDisplay: function(jip) {
				var val = jip.inputField.val(),
						display = '';
				$.each(jip.choiceValues, function(index, value) {
					if (val == value[0]) {
						display = value[1];
						return false;
					}
					return true;
				});
				return display;
			}
		};

		return this;
	})();
})(jQuery, window, document);

