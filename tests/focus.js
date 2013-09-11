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

	/**
	 * There is a problem with using :focus on Android browser and IE6-8. The document.hasFocus() always
	 * returns false (at least under the conditions of the test) and so :focus does too. So we do
	 * our own checks only check for the active element.
	 *
	 * @param $el The start element, we search for a focused element underneath this.
	 * @returns {jQuery} The focused element, or an empty jquery object.
	 */
	var findFocused = function($el) {
		var result = $();

		$el.find('*').each(function() {
			if (this === document.activeElement) {
				result = $(this);
				return false;
			}
			return true;
		});

		return result;
	};

	test('focus for text input type', 1, function() {
		span.attr('data-type', 'input');
		span.jinplace().click();

		var focused = findFocused(span);
		equal(focused.prop('tagName'), 'INPUT');
	});

	test('focus for textarea input type', 1, function() {
		span.attr('data-type', 'textarea');
		span.jinplace().click();

		var focused = findFocused(span);
		equal(focused.prop('tagName'), 'TEXTAREA');
	});

	test('focus for the select input type', 1, function() {
		span.attr('data-type', 'select');
		span.attr('data-data', '[[1,"A"],[2,"B"]]');
		span.jinplace().click();

		var focused = findFocused(span);
		equal(focused.prop('tagName'), 'SELECT');
	});

})();
