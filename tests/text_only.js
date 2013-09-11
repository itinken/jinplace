(function() {
	var div, qfix = $('#qunit-fixture');

	module('text_only option', {
		setup:function() {
			div = $('<div data-type="textarea"><ul><li>Hello</ul></div>');
			qfix.append(div);
		}
	});

	function submit() {
		div.find('form').trigger('jip:submit');
	}

	test('With text only returned html is displayed as text', 2, function() {
		div.jinplace();

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.val();
		textarea.val(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().toLowerCase().indexOf('<ul>') >= 0, 'literal html');
	});

	test('With text-only==false returned html is interpreted', 3, function() {
		div.attr('data-text-only', 'false');
		div.jinplace();

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.val();
		textarea.val(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().indexOf('<ul>') == -1, 'no literal html');
		equal(div.text(), 'HelloWorld');
	});

	test('With textOnly==false returned html is interpreted', 3, function() {
		div.jinplace({textOnly: false});

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.val();
		textarea.val(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().indexOf('<ul>') == -1, 'no literal html');
		equal(div.text(), 'HelloWorld');
	});
})();
