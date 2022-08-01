let cachedNodes = {};

window.onload = () => init();

const init = () => {
    getCachedNodes().then(nodes => { cachedNodes = { ...nodes } });
    hoverInitialIfNecessary();
}

const getCachedNodes = async() => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('cachedNodes', (cachedNodes) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(cachedNodes);
        });
    });
}

const hoverInitialIfNecessary = () => {
    chrome.storage.sync.get('selectors', ({ selectors }) => {
        Object.values(selectors).forEach(selector => {
            if (selector.checked) hoverElementBy(selector);
        });
    });
}

const hoverElementBy = (selector) => {
    chrome.runtime.sendMessage({ selector: selector.value, action: action }, function (response) {
        console.log(response);
    });
}

// TODO: check if this functions are necessary
const onDebuggerEnabled = (debuggerId) => {
    debuggerEnabled = true
}

const onAttach = (debuggerId) => {
    chrome.debugger.sendCommand(
        debuggerId, "Debugger.enable", {},
        onDebuggerEnabled.bind(null, debuggerId)
    );
}