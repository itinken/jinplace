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
		this.element = $(element); // The editable element (often a span or div).

		var opts = $.extend({},
				$.fn[pluginName].defaults,
				options,
				this.elementOptions(this.element));

		// TMP add all options to 'this'
		$.extend(this, opts);

        // Create an editor instance for this element.  This knows how to create
        // the editing field as specified in formtype.
		var editor = $.fn[pluginName].editors[opts.formType];
        this.editor = $.extend({}, editorBase, editor);

		this.bindElement();
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

			return opts;
		},

		bindElement: function() {
			// Remove any existing handler we set and bind to the activation click handler.
			this.activator
					.off('click.jip')
					.on('click.jip', $.proxy(this.clickHandler, this));

            // If there is no content, then we replace it with the empty indicator.
            var $el = this.element;
            if ($.trim($el.html()) == "")
                $el.html(this.nil);
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
			$(ev.currentTarget).off('click.jip')
					.on('click.jip', function(ev) { ev.preventDefault();});

            var self = this,
                    editor = self.editor;

            // Save original for use when cancelling.
			self.origValue = this.element.html();

			self.fetchData().done(function(data) {

				var field = editor.makeField(self.element, data);
                field.addClass(self.inputClass);

                var form = createForm(self, field, editor.buttonsAllowed);

                // Add the form part of the document
                self.element.html(form);

                // Now we can setup handlers and focus or otherwise activate the field.
                setupInput(self, form, field);
                $.each(editor.submitEvents, function (index, value) {
                    form.on(value, $.proxy(self.submitHandler, self));
                });

                editor.activate(field);
			});
		},

        /**
         * Get the parameters that will be sent in the ajax call to the server.
         * Called for both the url and loadurl cases.
         * @param isSend True if we are sending. (not for loadurl).
         * @returns {{id: string, object: *, attribute: *}}
         */
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
				data = $.trim(this.element.html());
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

            // Rebind the element for the next time
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
            ev.stopPropagation();
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
            var element = this.element,
                    editor = this.editor;

            // Do any conversion from the data format to the display format
            data = editor.displayValue(data);
			if (!data)
				data = this.nil;

			if (this.textOnly) {
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
		formType: "input",
		data: null,
		loadurl: null,
		objectName: undefined,
		attribute: undefined,
		activator: null,
		inputClass: '',
		okButton: null,
		cancelButton: null,
		textOnly: true,
		nil: '[ --- ]'
	};

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
    var createForm = function (jip, inputField, buttons) {
        jip.inputField = inputField;

        var form = $("<form>")
                .attr("style", "display: inline;")
                .attr("action", "javascript:void(0);")
                .append(inputField);

        if (buttons)
            addButtons(jip, form);

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
            var $button = $("<input>").attr("type", "button").attr("value", jip.okButton);
            $button.one('click', $.proxy(jip.submitHandler, jip));
            form.append($button);
            jip.okButtonField = $button;
        }

        if (jip.cancelButton) {
            $button = $("<input>").attr("type", "button").attr("value", jip.cancelButton);
            $button.one('click', $.proxy(jip.cancelHandler, jip));
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
    var setupInput = function (jip, $form, $field) {
        /**
         * A delayed blur handler.  When we click on a button, there will be a blur event
         * from the field before the button click. Therefore we need to wait before calling
         * the blur handler and cancel it if a click comes in first.
         *
         * @param handler The real blur handler that will be called.
         */
        var delayedBlur = function (handler) {

            var onBlur = function (ev) {
                var t = setTimeout(function () {
                    // in IE<=8 you cannot pass an event to a timeout function. We don't really
                    // care about the event anyway, so just create a dummy one to pass along.
                    ev = $.Event();
                    handler.call(jip, ev);
                }, 200);

                // Hook up all input fields within the element. This will include all the
                // buttons.  Also includes the text field, so you may be able to cancel
                // an inadvertent blur by quickly clicking back in the text. (No guarantees
                // though!).
                //
                // If a click occurs the the blur is cancelled.
                var f = jip.okButtonField;
                if (f) {
                    f.on('click', function () {
                        clearTimeout(t);
                    });
                }
            };

            // Set the handler to our wrapper.
            $field.on('blur', onBlur);
        };

        if (!jip.okButton) {
            delayedBlur(jip.submitHandler);
        } else if (!jip.cancelButton) {
            delayedBlur(jip.cancelHandler);
        }
    };

    /**
     * This is the prototype for an editor plugin.
     *
     * @type {{makeField: Function, activate: Function, submitEvents: Array, displayValue: Function}}
     */
    var editorBase = {
        /**
         * Are we allowed to automatically add buttons to the form. Set this to
         * true for a text input where it might make sense.  They are only added
         * if the user asks for them in any case.
         */
        buttonsAllowed: false,

        /**
         * Make the editing field that will be added to the form. Editing field is
         * a general term it could be a complex control or just a plain <input>.
         *
         * @param element The original element that we are going to edit.
         * @param data The initial data that should be used to initialise the
         * field.  For text inputs this will be just text, but for other types of
         * input it is an object specific to that field.
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
         * Activate the field. It is now part of the document and all handlers
         * have been set up.  In other words we are ready to go.
         *
         * @param field The editing field.  Passed as a convenience so we don't have
         * to save it.
         */
        activate: function (field) {
            field.focus();
        },

        /**
         * A list of events that the submit handler should be bound to.
         */
        submitEvents: ['submit'],

        /**
         * We are just about to remove the edit control and we have data returned from
         * the server. This method converts the server form of the data into the on page
         * value.
         *
         * For a text input this is just the same.
         *
         * For a select list, you may have [['1', 'blue'], ['2', 'green']]; if the server
         * returns '2', then you return 'green' from this method.
         * @param data The data as returned by the server which is to be used to populate
         * the page after the edit control is removed.
         * @returns {*} The data modified in any way that is appropriate.
         */
        displayValue: function (data) {
            return data;
        }
    };


    // The field editors can be overridden or added to
	$.fn[pluginName].editors = {

		// Now follows the editing objects for each input type.
		//
		// Each object has the following methods.
		//
		// activate(data): Create the editing field and replace the original text with it.
        // @param element The original text element that we are making editable.
		// @param data This is the text or data that the editing field must be initialised
        //             with.
        // @return The editing field as a jquery element.
		//
		// getDisplay(jip): (Optional) Get the displayable value of the field. If this
		// method does not exist then inputField.val() will be used.
		//    @param jip The JinPlace object.
        //
        // The object will also be initialised with its own private context
        // area as this.context. The editor can store anything it likes in there.
        //

		/**
		 * A regular text input field.
		 */
		input: {
            buttonsAllowed : true
        },

		// A textarea field
        textarea: {
            buttonsAllowed: true,

			makeField: function (element, data) {
                var width = element.width(),
                        height = element.height();

                var field = $("<textarea>")
                        .css({
                            'min-width': width,
                            'min-height': height
                        })
                        .html(data);


                if (field.elastic)
                    field.elastic();

                return field;
            }
        },

		/**
		 * A selection.  This is slightly more complex as we have to pass in the possible
		 * values so that one can be selected.  The getDisplay() method converts from
		 * the option value to the option text that is displayed.
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

			submitEvents : ['change'],

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

