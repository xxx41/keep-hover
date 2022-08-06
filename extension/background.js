"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var selectors = {};
var isVerboseMode = false;
var isDebuggerAttached = false;
var Background = /** @class */ (function () {
    function Background() {
    }
    Background.prototype.init = function () {
        this.getAllStorageSyncData().then(function (storageData) {
            var _a, _b;
            selectors = (_a = storageData.selectors) !== null && _a !== void 0 ? _a : {};
            isVerboseMode = (_b = storageData.isVerboseMode) !== null && _b !== void 0 ? _b : false;
        });
        this.addOnInstalledListener();
        this.addOnMessageListener();
    };
    Background.prototype.getAllStorageSyncData = function () {
        return new Promise(function (resolve, reject) {
            chrome.storage.sync.get(null, function (items) {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(items);
            });
        });
    };
    Background.prototype.addOnInstalledListener = function () {
        chrome.runtime.onInstalled.addListener(function () {
            chrome.storage.sync.set({ selectors: selectors, isVerboseMode: isVerboseMode });
        });
    };
    Background.prototype.addOnMessageListener = function () {
        var _this = this;
        chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
            var _a;
            var tabId = request.tab ? request.tab.id : (_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id;
            if (!tabId) {
                // TODO: log error
                return true;
            }
            if (request.action === 'remove') {
                _this.disableCss(tabId)
                    .then(function () { return sendResponse({ success: true }); });
                return true;
            }
            if (!isDebuggerAttached) {
                var debuggerId = { tabId: tabId };
                chrome.debugger.attach(debuggerId, "1.1");
                isDebuggerAttached = true;
            }
            _this.hoverOnElement(request.selector, tabId)
                .then(function (response) { return sendResponse(response); });
            return true;
        });
    };
    Background.prototype.disableCss = function (tabId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.disable')];
            });
        });
    };
    Background.prototype.hoverOnElement = function (selector, tabId) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var getDocumentResult, querySelectorResult;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        chrome.debugger.sendCommand({ tabId: tabId }, 'DOM.enable');
                        chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.enable');
                        return [4 /*yield*/, chrome.debugger.sendCommand({ tabId: tabId }, "DOM.getDocument")];
                    case 1:
                        getDocumentResult = _b.sent();
                        if (!((_a = getDocumentResult === null || getDocumentResult === void 0 ? void 0 : getDocumentResult.root) === null || _a === void 0 ? void 0 : _a.nodeId)) {
                            return [2 /*return*/, { success: false, message: 'Document node id not found' }];
                        }
                        return [4 /*yield*/, chrome.debugger.sendCommand({ tabId: tabId }, "DOM.querySelector", { nodeId: getDocumentResult.root.nodeId, selector: "".concat(selector.value) })];
                    case 2:
                        querySelectorResult = _b.sent();
                        if (!(querySelectorResult === null || querySelectorResult === void 0 ? void 0 : querySelectorResult.nodeId) || querySelectorResult.nodeId === 0) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Node not found for selector: ".concat(selector.value)
                                }];
                        }
                        return [4 /*yield*/, chrome.debugger.sendCommand({ tabId: tabId }, "CSS.forcePseudoState", { nodeId: querySelectorResult.nodeId, forcedPseudoClasses: ['hover'] })];
                    case 3:
                        _b.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return Background;
}());
new Background().init();
