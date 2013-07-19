
( function() {
	var orig = 'Hello world';
	var span;
	var span_ok;
	module("input", {
				setup: function() {
					span = $('<span>' + orig + '</span>');
					span_ok = $('<span data-ok-button="OK">' + orig + '</span>');
				}
			}
	);

	var qfix = $("#qunit-fixture");

	function click_ok() {
		var ok = span_ok.find('input[type=button]');
		ok.click();
	}

	test("Should be text input", 3, function() {
		span.appendTo(qfix).jinplace();

		equal(span.text(), orig);

		span.click();
		var inp = span.find('input');
		equal(inp.attr('type'), 'text');
		equal(inp.val(), orig);
	});

	test("Submit new value", 2, function() {
		span = span_ok;
		span.appendTo(qfix).jinplace();

		span.click();

		var inp = span.find('input');
		inp.val('ZZZ');

		click_ok();
		equal(span.find('input').length, 0, 'no input');
		equal(span.text(), 'ZZZ', 'new text');
	});

	asyncTest("Blur submits when no buttons are present", 2, function() {
		span.appendTo(qfix).jinplace();

		span.click();
		var inp = span.find('input[type=text]');
		inp.val('ZZZ');

		// $('#other').focus(); does not work
		inp.blur();

		setTimeout(function () {
			equal(span.find('input').length, 0, 'no input after timeout');
			equal(span.text(), 'ZZZ', 'text changed');

			start();
		}, BLUR_TIMEOUT);

	});

	asyncTest("Blur cancels when ok button present", 2, function() {
		span = span_ok;
		span.appendTo(qfix).jinplace();

		span.click();
		var inp = span.find('input[type=text]');
		inp.val('ZZZ');

		// $('#other').focus(); does not work
		inp.blur();

		setTimeout(function () {
			equal(span.find('input').length, 0, 'no input after timeout');
			equal(span.text(), orig, 'orig text');

			start();
		}, BLUR_TIMEOUT);

	});

} )();
