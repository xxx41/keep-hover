"use strict";
var Content = /** @class */ (function () {
    function Content() {
    }
    Content.prototype.init = function () {
        this.hoverInitialIfNecessary();
    };
    Content.prototype.hoverInitialIfNecessary = function () {
        var _this = this;
        chrome.storage.sync.get('selectors', function (_a) {
            var _b;
            var selectors = _a.selectors;
            Object.values((_b = selectors) !== null && _b !== void 0 ? _b : {}).forEach(function (selector) {
                if (selector.checked)
                    _this.hoverElementBy(selector);
            });
        });
    };
    Content.prototype.hoverElementBy = function (selector) {
        chrome.runtime.sendMessage({ selector: selector }, function (response) {
            //TODO: remove console log
            console.log(response);
        });
    };
    return Content;
}());
var content = new Content();
content.init();
