
( function() {
	var orig = 'Hello world';
	var span;
	var span_ok;
	module("textarea", {
				setup: function() {
					span = $('<span data-type=textarea>' + orig + '</span>');
					span_ok = $('<span data-type=textarea data-ok-button="OK">' + orig + '</span>');
				}
			}
	);

	var qfix = $("#qunit-fixture");

	function click_ok() {
		var ok = span_ok.find('input[type=button]');
		ok.click();
	}

	test("Should be textarea field", 2, function() {
		span.appendTo(qfix).jinplace();

		equal(span.text(), orig);

		span.click();
		var inp = span.find('textarea');
		equal(inp.val(), orig);
	});

	test("Submit new value", 2, function() {
		span = span_ok;
		span.appendTo(qfix).jinplace();

		span.click();

		var inp = span.find('textarea');
		inp.val('ZZZ');

		click_ok();
		equal(span.find(':input').length, 0, 'no input');
		equal(span.text(), 'ZZZ', 'new text');
	});

	asyncTest("Blur submits when no buttons are present", 2, function() {
		span.appendTo(qfix).jinplace();

		span.click();
		var inp = span.find('textarea');
		inp.val('ZZZ');

		// $('#other').focus(); does not work
		inp.blur();

		setTimeout(function () {
			equal(span.find(':input').length, 0, 'no input after timeout');
			equal(span.text(), 'ZZZ', 'text changed');

			start();
		}, BLUR_TIMEOUT);

	});

	asyncTest("Blur cancels when ok button present", 2, function() {
		span = span_ok;
		span.appendTo(qfix).jinplace();

		span.click();
		var inp = span.find('textarea');
		inp.val('ZZZ');

		// $('#other').focus(); does not work
		inp.blur();

		setTimeout(function () {
			equal(span.find(':input').length, 0, 'no input after timeout');
			equal(span.text(), orig, 'orig text');

			start();
		}, BLUR_TIMEOUT);

	});

} )();
