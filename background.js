const options = {
    selectors: {},
    isDebugMode: false,
    action: {},
    cacheNodes: {}
}
const initOptions = getAllStorageSyncData().then(items => {
    options.selectors = items.selectors ?? {};
    options.isDebugMode = items.isDebugMode ?? false;
})

chrome.runtime.onInstalled.addListener(() => {
    const selectors = options.selectors;
    const isDebugMode = options.isDebugMode;

    console.log(options);
    chrome.storage.sync.set({ selectors, isDebugMode });
});

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

function onAttach(debuggerId) {
    console.log(debuggerId)
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!request.selectors) {
        return true;
    }

    const tabId = request.tab ? request.tab.id : sender.tab.id;
    let debuggerId = { tabId };
    chrome.debugger.attach(debuggerId, "1.1", onAttach.bind(null, debuggerId));

    Object.values(request.selectors).forEach(selector => {
        toggleHoverOnElement(selector, tabId, selector.checked).then(sendResponse({status: 'ok'}));
        return true;
    });
});

async function toggleHoverOnElement(selector, tabId, forceHover) {

    if (!forceHover) {
        return;
    }

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

function getForceHover(action) {
    return action == 'enable';
}