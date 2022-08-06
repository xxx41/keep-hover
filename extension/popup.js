"use strict";
var ADDER_SELECTOR = '.popup__selector-adder';
var SELECTORS_SELECTOR = '.popup__selectors';
var ADDER_TEXT_SELECTOR = '.popup__selector-adder > input[type=text]';
var ADDER_BUTTON_SELECTOR = '.popup__selector-adder > input[type=button]';
var verboseMode;
var global = {
    selectorId: 0,
    selectors: {},
    isVerboseMode: false
};
var Popup = /** @class */ (function () {
    function Popup() {
    }
    Popup.prototype.init = function () {
        var _this = this;
        verboseMode = document.querySelector('#verboseMode');
        chrome.storage.sync.get('isVerboseMode', function (_a) {
            var isVerboseMode = _a.isVerboseMode;
            verboseMode.checked = isVerboseMode;
            global.isVerboseMode = isVerboseMode;
        });
        chrome.storage.sync.get('selectors', function (_a) {
            var selectors = _a.selectors;
            global.selectors = selectors;
            _this.buildInitialSelectors(selectors);
            _this.adderClickListener(selectors);
            _this.verboseModeListener();
        });
    };
    Popup.prototype.verboseModeListener = function () {
        verboseMode.onchange = function (event) {
            var element = event.target;
            var isVerboseMode = element.checked;
            global.isVerboseMode = isVerboseMode;
            chrome.storage.sync.set({ isVerboseMode: isVerboseMode });
        };
    };
    Popup.prototype.adderClickListener = function (selectors) {
        var _this = this;
        var adder = document.querySelector(ADDER_TEXT_SELECTOR);
        var button = document.querySelector(ADDER_BUTTON_SELECTOR);
        button.onclick = function () {
            if (!adder.value)
                return;
            if (_this.selectorHasAlreadyBeenAdded(selectors, adder.value)) {
                _this.log('warning', 'Selector has already been added');
            }
            else {
                var selector = _this.createSelector(adder.value, selectors);
                _this.disableOtherCheckboxes(selector);
                _this.hoverElementBy(selector);
            }
        };
    };
    Popup.prototype.selectorHasAlreadyBeenAdded = function (selectors, value) {
        return Object.values(selectors).filter(function (element) { return element.value === value; }).length > 0;
    };
    Popup.prototype.createSelector = function (selectorText, selectors) {
        if (selectors === void 0) { selectors = {}; }
        var id = this.appendSelector(selectorText);
        var selector = {
            id: id,
            value: selectorText,
            checked: true
        };
        selectors[id] = selector;
        global.selectors = selectors;
        chrome.storage.sync.set({ selectors: selectors });
        return selector;
    };
    Popup.prototype.hoverElementBy = function (selector) {
        var _this = this;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.runtime.sendMessage({
                selector: selector,
                tab: tabs[0]
            }, function (response) {
                if (!response.success) {
                    _this.log('error', "Node not found for selector: ".concat(selector.value));
                }
            });
        });
    };
    Popup.prototype.removeHover = function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.runtime.sendMessage({
                action: 'remove',
                tab: tabs[0]
            }, function (response) { return console.log(response); });
        });
    };
    Popup.prototype.buildInitialSelectors = function (selectors) {
        var _this = this;
        global.selectorId = Object.values(selectors !== null && selectors !== void 0 ? selectors : []).length;
        Object.entries(selectors !== null && selectors !== void 0 ? selectors : []).forEach(function (_a) {
            var key = _a[0], selector = _a[1];
            _this.appendSelector(selector.value, parseInt(key), selector.checked);
        });
    };
    Popup.prototype.appendSelector = function (selectorText, selectorId, checked) {
        if (selectorId === void 0) { selectorId = null; }
        if (checked === void 0) { checked = true; }
        var selectors = document.querySelector(SELECTORS_SELECTOR);
        var adder = document.querySelector(ADDER_SELECTOR);
        var id = selectorId ? selectorId.toString() : this.generateId();
        selectors.insertBefore(this.createSelectorNode(selectorText, id, checked), adder);
        return id.toString();
    };
    Popup.prototype.createSelectorNode = function (selectorText, selectorId, checked) {
        var checkboxName = "ch".concat(selectorId);
        var selectorElement = this.createElement('div', this.getSelectorNodeAttributes(selectorId));
        var checkboxElement = this.createElement('input', this.getSelectorCheckboxAttributes(checkboxName, checked));
        var labelElement = this.createElement('label', this.getSelectorLabelAttributes(checkboxName, selectorText));
        var deleteElement = this.createElement('button', this.getSelectorDeleteAttributes());
        this.checkboxOnchangeListener(checkboxElement);
        this.deleteOnclickListener(deleteElement);
        [checkboxElement, labelElement, deleteElement].forEach(function (element) {
            selectorElement.appendChild(element);
        });
        return selectorElement;
    };
    Popup.prototype.createElement = function (tag, attributes) {
        if (attributes === void 0) { attributes = []; }
        var element = document.createElement(tag);
        attributes.forEach(function (attribute) {
            switch (attribute.attr) {
                case 'class':
                    element.classList.add(attribute.value);
                    break;
                case 'for':
                    element.setAttribute('for', attribute.value);
                    break;
                default:
                    element[attribute.attr] = attribute.value;
                    break;
            }
        });
        return element;
    };
    Popup.prototype.getSelectorNodeAttributes = function (id) {
        return [
            { attr: 'id', value: id },
            { attr: 'class', value: 'popup__selector' }
        ];
    };
    Popup.prototype.getSelectorCheckboxAttributes = function (name, checked) {
        if (checked === void 0) { checked = true; }
        return [
            { attr: 'type', value: 'checkbox' },
            { attr: 'id', value: name },
            { attr: 'checked', value: checked }
        ];
    };
    Popup.prototype.getSelectorLabelAttributes = function (checkboxName, labelText) {
        return [
            { attr: 'innerText', value: labelText },
            { attr: 'for', value: checkboxName }
        ];
    };
    Popup.prototype.getSelectorDeleteAttributes = function () {
        return [
            { attr: 'class', value: 'popup__selector-delete' }
        ];
    };
    Popup.prototype.checkboxOnchangeListener = function (checkbox) {
        var _this = this;
        checkbox.onchange = function (event) {
            var element = event.target;
            var parent = element.parentNode;
            if (element.checked) {
                var selector = global.selectors[parent.id];
                global.selectors[parent.id].checked = true;
                var selectors_1 = global.selectors;
                chrome.storage.sync.set({ selectors: selectors_1 });
                _this.disableOtherCheckboxes(selector);
                _this.hoverElementBy(selector);
            }
            else {
                global.selectors[parent.id].checked = false;
                var selectors_2 = global.selectors;
                chrome.storage.sync.set({ selectors: selectors_2 });
                _this.removeHover();
            }
        };
    };
    Popup.prototype.deleteOnclickListener = function (deleteElement) {
        var _this = this;
        deleteElement.onclick = function (event) {
            var element = event.target;
            var parent = element.parentNode;
            var id = parent.id;
            if (global.selectors[id].checked)
                _this.removeHover();
            delete global.selectors[id];
            parent.remove();
            var selectors = global.selectors;
            chrome.storage.sync.set({ selectors: selectors });
        };
    };
    Popup.prototype.generateId = function () {
        var currentId = global.selectorId;
        global.selectorId++;
        return 'sel' + currentId;
    };
    Popup.prototype.disableOtherCheckboxes = function (activeSelector) {
        Object.values(global.selectors).forEach(function (selector) {
            if (selector.id !== activeSelector.id) {
                var checkbox = document.querySelector("#".concat(selector.id, " > input[type=checkbox]"));
                checkbox['checked'] = false;
                global.selectors[selector.id].checked = false;
                var selectors_3 = global.selectors;
                chrome.storage.sync.set({ selectors: selectors_3 });
            }
        });
    };
    Popup.prototype.log = function (level, message) {
        var _this = this;
        if (!global.isVerboseMode)
            return;
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tabId = tabs[0] ? tabs[0].id : null;
            if (!tabId) {
                return;
            }
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: _this.consoleLog,
                args: [message, level]
            });
        });
    };
    Popup.prototype.consoleLog = function (message, level) {
        console.log({ level: level, message: message });
    };
    return Popup;
}());
new Popup().init();
