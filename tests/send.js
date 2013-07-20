/** @name module */
/** @name test */
(function() {
	var qfix = $('#quint-fixture');
	var span ;

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
			qfix.append(span);
			span = $('<span data-ok-button="OK">Hi</span>');
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

	test('when value returns object, values are sent', function() {
		// Create a custom input editor that returns an object.
		$.fn.jinplace.editors.test_value_editor = {
			value: function() {
				console.log('in custom');
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
})();
