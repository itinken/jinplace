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

	// The actual plugin constructor
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


		// TMP add all options to 'this'
		$.extend(this, opts);

        // Create an editor instance for this element.  This knows how to create
        // the editing field as specified in type.
		var editor = $.fn[pluginName].editors[opts.type];
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

		bindElement: function() {
			// Remove any existing handler we set and bind to the activation click handler.
			this.activator
					.off('click.jip')
					.on('click.jip', $.proxy(this.clickHandler, this));

            // If there is no content, then we replace it with the empty indicator.
            var $el = this.element;
            if ($.trim($el.html()) == "")
                $el.html(this.placeholder);
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
				"object": this.object,
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
					data: this.requestParams(false),
					context: self
				});

			} else {
				data = $.trim(this.element.html());
			}

            var placeholderFilter = function (data) {
                if (data == self.placeholder)
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
				data = this.placeholder;

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
		type: "input",
		textOnly: true,
		placeholder: '[ --- ]'
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
     * This is the interface of an editor function. Plugins need only redefine the methods
     * or data that are appropriate.
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

