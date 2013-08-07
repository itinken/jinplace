/** @name module */
/** @name test */
/** @name {object} ajax_data */
(function() {
	var qfix = $('#quint-fixture');
	var span;

	function go(el) {
		el = el || span;
		el.jinplace();
		el.click();
	}

	function submit(v) {
		if (v)
			set_data(v);
		span.find('form').trigger('jip:submit');
	}

	function set_data(s) {
		span.find(':input').first().val(s);
	}

	module('send', {
		setup: function() {
			ajax_data = {};  // defined in index.html

			span = $('<span data-ok-button="OK">Hi</span>');
			qfix.append(span);
		}
	});

	test('value is sent', 3, function() {
		go();
		set_data('oo');
		submit();

		ok(ajax_data);
		equal(ajax_data.value, 'oo');
		strictEqual(ajax_data.attribute, undefined);
	});

	test('id is sent', 3, function () {
		span.attr('id', 'iii');
		go();
		submit('vv');

		ok(ajax_data);
		equal(ajax_data.value, 'vv');
		equal(ajax_data.id, 'iii');
	});

	test('attribute is sent', 3, function() {
		span.attr('data-attribute', 'aaa');
		go();
		set_data('vv');
		submit();

		ok(ajax_data);
		equal(ajax_data.value, 'vv');
		equal(ajax_data.attribute, 'aaa');
	});

	test('object is sent', 4, function() {
		span.attr('data-object', 'ooo');
		span.attr('data-attribute', 'aaa');
		go();
		set_data('vv');
		submit();

		ok(ajax_data);
		equal(ajax_data.object, 'ooo');
		equal(ajax_data.attribute, 'aaa');
		equal(ajax_data.value, 'vv');
	});

	test('when value returns object, values are sent', 5, function() {
		// Create a custom input editor that returns an object.
		$.fn.jinplace.editors.test_value_editor = {
			value: function() {
				return {
					first: 1,
					second: 2,
					third: 3
				}
			}
		};

		span.attr('data-type', 'test_value_editor');
		go();
		submit('vv');

		ok(ajax_data);
		equal(ajax_data.first, 1);
		equal(ajax_data.second, 2);
		equal(ajax_data.third, 3);

		// and value is not set
		equal(ajax_data.value, undefined);
	});

	test('submit to function returning string', 4, function() {
		var rval = {};

		var cancelVal = 'test for function';
		span.attr('data-cancel-button', cancelVal);

		span.jinplace({
			submitFunction: function(value, opts) {
				rval.value = value;
				rval.opts = opts;
				rval.thisVal = this;

				return value;
			}
		});

		span.click();
		var value = 'submitted value';
		submit(value);

		equal(value, rval.value);
		equal(cancelVal, rval.opts.cancelButton);
		equal(span.text(), value);
		equal(window, rval.thisVal);
	});

	test('submit to function returning promise', 3, function() {
		var rval = {};

		var cancelVal = 'test for function';
		span.attr('data-cancel-button', cancelVal);

		span.jinplace({
			submitFunction: function(value, opts) {
				rval.value = value;
				rval.opts = opts;

				return $.Deferred()
						.resolve('X' + value + 'X')
						.promise();
			}
		});

		span.click();
		var value = 'submitted value';
		submit(value);

		equal(value, rval.value);
		equal(cancelVal, rval.opts.cancelButton);
		equal(span.text(), 'X'+value+'X');
	});

	test('submit to function returning undefined', 4, function() {
		var rval = {};

		var cancelVal = 'test for function';
		span.attr('data-cancel-button', cancelVal);

		span.jinplace({
			submitFunction: function(value, opts) {
				rval.value = value;
				rval.opts = opts;
				rval.thisVal = this;
			}
		});

		span.click();
		var value = 'submitted value';
		submit(value);

		equal(value, rval.value);
		equal(cancelVal, rval.opts.cancelButton);
		equal(span.text(), "[ --- ]");
		equal(window, rval.thisVal);
	});

	test('submit to function in strict mode', 2, function() {
		var rval = {};

		span.jinplace({
			submitFunction: function(value, opts) {
				'use strict';
				rval.value = value;
				rval.opts = opts;
				rval.thisVal = this;
			}
		});

		span.click();
		submit('xyz');

		equal('xyz', rval.value);
		equal(undefined, rval.thisVal);
	})
})();
