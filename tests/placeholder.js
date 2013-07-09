
(function() {

    module('placeholder');

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

    test("nil as placeholder fallback", function () {
        expect(3);

        $qfix.append("<span id='E' data-nil='HI'></span>");
        var e = $('#E').jinplace().get(0);
        equal($(e).text(), "HI");

        $qfix.append("<span id='F'></span>");
        e = $('#F').jinplace({nil: 'HO'}).get(0);
        equal($(e).text(), "HO");

        $qfix.append("<span id='G' data-placeholder='HI'></span>");
        e = $('#G').jinplace({nil: 'GG'}).get(0);
        equal($(e).text(), "HI");
    });

})();
