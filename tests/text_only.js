(function() {
	var div, to_div;

	module('text_only option', {
		setup:function() {
			div = $('<div data-type="textarea"><ul><li>Hello</ul></div>');
		}
	});

	function submit() {
		div.find('form').trigger('jip:submit');
	}

	test('With text only returned html is displayed as text', 2, function() {
		div.jinplace();

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.html();
		textarea.html(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().indexOf('<ul>') >= 0, 'literal html');
	});

	test('With textOnly returned html is displayed as text', 2, function() {
		div.jinplace();

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.html();
		textarea.html(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().indexOf('<ul>') >= 0, 'literal html');
	});

	test('With textOnly==false returned html is interpreted', 2, function() {
		div.attr('data-text-only', 'false');
		div.jinplace();

		div.click();

		var textarea = div.find(':input');
		var orig = textarea.html();
		textarea.html(orig.replace(/Hello/, 'Hello<li>World'));
		submit();

		ok(div.text().indexOf('World') > 0, 'text changed');
		ok(div.text().indexOf('<ul>') == -1, 'literal html');
	});
})();
