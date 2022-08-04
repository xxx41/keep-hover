let selectors = {};
let isDebugMode = false;
let isDebuggerAttached = false;

init();

function init() {
    getAllStorageSyncData().then(items => {
        selectors = items.selectors ?? {};
        isDebugMode = items.isDebugMode ?? false;
    });
    addOnInstalledListener();
    addOnMessageListener();
}

function addOnInstalledListener() {
    chrome.runtime.onInstalled.addListener(() => {
        chrome.storage.sync.set({ selectors, isDebugMode });
    });
}

function getAllStorageSyncData() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(null, (items) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(items);
        });
    });
}

function addOnMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        const tabId = request.tab ? request.tab.id : sender.tab.id;

        if (request.action === 'remove') {
            disableCss(tabId).then(sendResponse({status: 'ok'}));;
            return true;
        }

        if (!isDebuggerAttached) {
            let debuggerId = { tabId };
            chrome.debugger.attach(debuggerId, "1.1");
            isDebuggerAttached = true;
        }

        hoverOnElement(request.selector, tabId).then(sendResponse({status: 'ok'}));
        return true;
    });
}

async function disableCss(tabId) {
    chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.disable')
}

async function hoverOnElement(selector, tabId) {

    chrome.debugger.sendCommand({ tabId: tabId }, 'DOM.enable')
    chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.enable')

    const getDocumentResult = await chrome.debugger.sendCommand(
        { tabId: tabId },
        "DOM.getDocument"
    )

    const querySelectorResult = await chrome.debugger.sendCommand(
        { tabId: tabId },
        "DOM.querySelector",
        { nodeId: getDocumentResult.root.nodeId, selector: `${selector.value}` }
    );

    const forcePseudoStateResult = await chrome.debugger.sendCommand(
        { tabId: tabId },
        "CSS.forcePseudoState",
        { nodeId: querySelectorResult.nodeId, forcedPseudoClasses: ['hover'] }
    );
}