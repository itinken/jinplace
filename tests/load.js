(function () {
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

	module('load', {
		setup: function () {
			ajax_data = {};  // defined in index.html

			span = $('<span data-loadurl="fred">Hi</span>');
			qfix.append(span);
		}
	});

	test('load text field from url', 1, function() {
		go();

		equal(span.find(':input').val(), 'fred');
	});

	test('data attr overrides loadurl', 1, function() {
		span.attr('data-data', 'tashy');
		go();

		equal(span.find(':input').val(), 'tashy');
	});

	test('load function supplied', 1, function() {
		span.jinplace({
			loadFunction: function(opts) {
				return 'tinka';
			}
		});
		span.click();

		equal(span.find(':input').val(), 'tinka');
	});

	test('load function returns undefined', 1, function() {
		span.jinplace({
			loadFunction: function(opts) {
			}
		});
		span.click();

		equal(span.find(':input').val(), '');
	})
})();
