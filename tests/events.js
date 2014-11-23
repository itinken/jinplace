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
		});
		span.jinplace().click();

		var input = span.find('input');
		input.val('hello');
		click_ok();

		equal(all_ok, 'hello');
	});

	test('failure triggers jinplace:fail event', function() {
		// We need to revert to the real ajax method for this test.
		var saved = $.ajax;
		$.ajax = $.orig_ajax;
		try {
			span = $('<span data-url="/no-such-page" data-ok-button="OK">Q</span>')
					.appendTo($('#qunit-fixture'));

			var d = $.Deferred();

			// Set up handlers
			span.on('jinplace:done', function() {
				d.reject('fail due to successful request');
			});
			span.on('jinplace:fail', function(ev, xhr, textStatus, errorThrown) {
				// Should be 'Not found' if running on the jinplace.org website
				// A cross site scripting error if running the file directly.
				console.log('ERR:',errorThrown);
				d.resolve(textStatus);
			});

			span.jinplace().click();
			var input = span.find('input');
			input.val('hello');
			click_ok();
			
			QUnit.stop();
			var t = setTimeout(function () {
				// This is here in case there is no response. The test is failed with
				// a timeout message.
				console.log("after timeout", span.text());
				d.reject('fail due to timeout');
			}, 300);

			// Whatever happens we check the data passed in the resolve or reject call and
			// restart the test runner.
			d.always(function(result) {
				clearTimeout(t);
				equal(result, "error");
				QUnit.start();
			});

		} finally {
			// Restore the mock ajax method.
			$.ajax = saved;
		}
	});

	test('success also triggers jinplace:always event', function() {
		var all_ok = '';
		span.on('jinplace:done', function (ev, data) {
			all_ok = data;
			console.log('all done', data);
		});
		span.on('jinplace:always', function(ev, data) {
			all_ok += ' always ' + data;
		});

		span.jinplace().click();

		var input = span.find('input');

		var changed_data = 'hello';
		input.val(changed_data);
		click_ok();

		// The done handler sets all_ok to changed_data, then the always handler appends ' always '+changed_data.
		equal(all_ok, changed_data + ' always ' + changed_data);
	});

	test('failure also triggers jinplace:always event', function() {
		// We need to revert to the real ajax method for this test.
		var saved = $.ajax;
		$.ajax = $.orig_ajax;
		try {
			span = $('<span data-url="/no-such-page" data-ok-button="OK">Q</span>')
					.appendTo($('#qunit-fixture'));

			var d = $.Deferred();

			// Set up handlers
			span.on('jinplace:done', function () {
				d.reject('fail due to successful request');
			});
			span.on('jinplace:always', function (ev, xhr, textStatus, errorThrown) {
				d.resolve(textStatus);
			});

			span.jinplace().click();
			var input = span.find('input');
			input.val('hello');
			click_ok();

			QUnit.stop();
			var t = setTimeout(function () {
				// This is here in case there is no response. The test is failed with
				// a timeout message.
				console.log("after timeout", span.text());
				d.reject('fail due to timeout');
			}, 300);

			// Whatever happens we check the data passed in the resolve or reject call and
			// restart the test runner.
			d.always(function (result) {
				clearTimeout(t);
				equal(result, "error");
				QUnit.start();
			});

		} finally {
			// Restore the mock ajax method.
			$.ajax = saved;
		}
	});

	test('success event when there is a submit function', function () {
		var all_ok = '';
		span.on('jinplace:done', function (ev, data) {
			all_ok = 'data:' + data;
			console.log('all done', data);
		});
		span.on('jinplace:always', function (ev, data) {
			all_ok += ':always:' + data;
		});

		span.jinplace({
			submitFunction: function() {
				return 'hello';
			}
		}).click();

		var input = span.find('input');

		var changed_data = 'hello';
		input.val(changed_data);
		click_ok();

		// The done handler sets all_ok to changed_data, then the always handler appends ' always '+changed_data.
		equal(all_ok, 'data:' + changed_data + ':always:' + changed_data);
	});

	test('failure event when there is a submit function', function () {
		var all_ok = '';
		span.on('jinplace:fail', function (ev, data) {
			all_ok = 'data:' + data;
		});
		span.on('jinplace:always', function (ev, data) {
			all_ok += ':always:' + data;
		});

		span.jinplace({
			submitFunction: function () {
				return $.Deferred().reject('hello');
			}
		}).click();

		var input = span.find('input');

		var changed_data = 'hello';
		input.val(changed_data);
		click_ok();

		// The done handler sets all_ok to changed_data, then the always handler appends ' always '+changed_data.
		equal(all_ok, 'data:' + changed_data + ':always:' + changed_data);
	});
})();
