
(function() {
	var span;
	module('placeholder', {
		setup: function() {
			span = $('<span data-placeholder="HI"></span>');
		}
	});

	var $qfix = $("#qunit-fixture");

	test("placeholder as attribute", function () {
		$qfix.append("<span id='E' data-placeholder='HI'></span>");
		var e = $('#E').jinplace().get(0);
		equal($(e).text(), "HI");
	});

	test("placeholder as config", function () {
		$qfix.append("<span id='E'></span>");
		var e = $('#E').jinplace({
			placeholder: 'HI'
		})[0];
		equal($(e).text(), "HI");
	});

	test('Empty element contains placeholder', 1, function() {
		span.jinplace();

		equal(span.text(), 'HI');
	});

	test('Placeholder not present when editing', 2, function() {
		span.jinplace();
		span.click();
		equal(span.find(':input').val(), '');
		equal(span.find(':input').text(), '');
	});

	test('Placeholder applied when empty text received', 2, function() {
		span.jinplace();
		span.click();

		span.find(':input').val('');
		span.find('form').trigger('jip:submit');

		equal(span.find(':input').length, 0);
		equal(span.text(), 'HI');
	});

	test('Placeholder with html', 1, function() {
		span.attr('data-placeholder', '<i>hi</i>');
		span.jinplace();

		equal(span.text(), 'hi');
	});

	test('Placeholder with html after submit', 2, function() {
		span.attr('data-placeholder', '<i>hi</i>');
		span.jinplace();

		equal(span.text(), 'hi');

		span.click();
		span.find('form').trigger('jip:submit');

		equal(span.text(), 'hi');
	});
})();
