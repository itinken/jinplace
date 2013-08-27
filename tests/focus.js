/**
 * Test that the focus is set to the created form element.
 */
(function() {
	var span;

	module('focus', {
		setup: function() {
			span = $('<span id="FT">Q</span>').appendTo('#qunit-fixture');
		}
	});

	test('focus for text input type', 1, function() {
		span.attr('data-type', 'input');
		span.jinplace().click();

		var focused = span.find(':focus').first();
		equal(focused.prop('tagName'), 'INPUT');
	});

	test('focus for textarea input type', 1, function() {
		span.attr('data-type', 'textarea');
		span.jinplace().click();

		var focused = span.find(':focus').first();
		equal(focused.prop('tagName'), 'TEXTAREA');
	});

	test('focus for the select input type', 1, function() {
		span.attr('data-type', 'select');
		span.attr('data-data', '[[1,"A"],[2,"B"]]');
		span.jinplace().click();

		var focused = span.find(':focus').first();
		equal(focused.prop('tagName'), 'SELECT');
	});

})();
