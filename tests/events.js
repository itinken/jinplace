(function () {

	var span;

	module('events', {
		setup: function () {
			span = $('<span data-ok-button="OK">Q</span>').appendTo($('#qunit-fixture'));
		}
	});

	function click_ok() {
		var ok = span.find('input[type=button]');
		ok.click();
	}

	test('event jinplace:done triggered after finish', function() {
		var all_ok = false;
		span.on('jinplace:done', function (ev, data) {
			all_ok = data;
			console.log('all done', data);
		});
		span.jinplace().click();

		var input = span.find('input');
		input.val('hello');
		click_ok();

		equal(all_ok, 'hello');
	});

})();
