
( function() {
	var span;

	// The default selected option
	var orig_value = 2;
	var orig_text = "Green";

	module("select", {
				setup: function() {
					span = $('<span data-object=colours data-type=select>' + orig_text + '</span>');
					span.attr('data-data', '[[1, "Red"], [2, "Green", 1], [3, "Blue"]]');
				}
			}
	);

	var qfix = $("#qunit-fixture");

	test("Should be select input", 3, function() {
		span.appendTo(qfix).jinplace();

		equal(span.text(), orig_text);

		span.click();
		var inp = span.find(':input');
		equal(inp.prop('tagName'), 'SELECT');
		equal(inp.val(), orig_value);
	});

	test("Submit new value", 2, function() {
		span.appendTo(qfix).jinplace();

		span.click();

		var inp = span.find(':input');
		inp.val(1).change();

		equal(span.find(':input').length, 0, 'no input');
		equal(span.text(), 'Red', 'new text');
	});

} )();
