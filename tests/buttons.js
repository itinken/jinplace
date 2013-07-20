
(function() {

	var span;

	module('buttons', {
		setup: function() {
			span = $('<span>Q</span>').appendTo($('#qunit-fixture'));
		}
	});

	test('ok button', 3, function() {
		span.attr('data-ok-button', 'Go');
		span.jinplace().click();

		var okB = span.find('input[type=button]');
		equal(okB.val(), 'Go');
		ok(okB.hasClass('jip-button'));
		ok(okB.hasClass('jip-ok-button'));
	});

	test('cancel button', 4, function() {
		span.attr('data-cancel-button', 'Cancel');
		span.jinplace().click();

		var cancel = span.find('input[type=button]');
		equal(cancel.length, 1);
		equal(cancel.val(), 'Cancel');
		ok(cancel.hasClass('jip-button'));
		ok(cancel.hasClass('jip-cancel-button'));
	});

	test('both buttons', 5, function() {
		span.attr('data-ok-button', 'OK');
		span.attr('data-cancel-button', 'Cancel');
		span.jinplace().click();

		var buttons = span.find('input[type=button]');
		equal(buttons.length, 2);
		equal(buttons.first().val(), 'OK');
		equal(buttons.last().val(), 'Cancel');
		ok(buttons.first().hasClass('jip-ok-button'));
		ok(buttons.last().hasClass('jip-cancel-button'));
	});

	test('click ok button', 1, function() {
		span.attr('data-ok-button', 'Go');
		span.jinplace().click();

		var submitted = false;
		span.find('form').on('submit', function() {
			submitted = true;
		});

		var b = span.find('input[type=button]');
		b.click();

		ok(submitted);
	});

	test('click cancel button', 1, function() {
		span.attr('data-cancel-button', 'Stop');
		span.jinplace().click();

		var cancelled = false;
		span.find('form').on('jip:cancel', function() {
			cancelled = true;
		});

		var b = span.find('input[type=button]');
		b.click();

		ok(cancelled);
	});
})();
