let cachedNodes = {};

window.onload = () => init();

const init = () => {
    getCachedNodes().then(nodes => { cachedNodes = { ...nodes } });
    hoverInitialElements();
    selectorsOnchangeListener();
}

async function getCachedNodes() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('cachedNodes', (cachedNodes) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(cachedNodes);
        });
    });

}

const hoverInitialElements = () => {
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

const selectorsOnchangeListener = () => {
    chrome.storage.onChanged.addListener((changes, area) => {
        if (!changes.selectors) {
            return;
        }

        const newKeys = Object.keys(changes.selectors.newValue ?? {});
        const oldKeys = Object.keys(changes.selectors.oldValue ?? {});

        (hasAddedOrRemovedSelector(newKeys, oldKeys))
            ? handleAddedOrRemovedSelector(newKeys, oldKeys, changes)
            : handleCheckedChange(changes);
    });
}

const handleCheckedChange = (changes) => {
    Object.entries(changes.selectors.newValue).forEach(([key, selector]) => {
        const newValueChecked = selector.checked;
        const oldValueChecked = changes.selectors.oldValue[key].checked;

        if (!newValueChecked && oldValueChecked) {
            replaceNode(selector);
        }
    });
}

const handleAddedOrRemovedSelector = (newKeys, oldKeys, changes) => {
    const addedSelector = added(newKeys, oldKeys);
    const removedSelector = removed(newKeys, oldKeys);

    if (addedSelector) {
        const selector = changes.selectors.newValue[addedSelector].value;
        const element = document.querySelector(selector);

        cachedNodes[addedSelector] = element;
        chrome.storage.sync.set({ cachedNodes });
    }

    if (removedSelector) {
        replaceNode(changes.selectors.oldValue[removedSelector]);
        delete cachedNodes[removedSelector];
        chrome.storage.sync.set({ cachedNodes });
    }
}

const hasAddedOrRemovedSelector = (newKeys, oldKeys) => {
    return newKeys.length !== oldKeys.length
}

function replaceNode(selector) {
    const element = document.querySelector(selector.value);
    const parent = element.parentNode;

    element.remove();
    parent.appendChild(cachedNodes[selector.id]);
}

function added(newKeys, oldKeys) {
    return newKeys.filter(key => !oldKeys.includes(key))[0] ?? null;
}

function removed(newKeys, oldKeys) {
    return oldKeys.filter(key => !newKeys.includes(key))[0] ?? null;
}