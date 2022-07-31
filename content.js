let cachedNodes = {};
const initCachedNodes = getCachedNodes().then(nodes => {
    cachedNodes = { ...nodes };
});

chrome.storage.onChanged.addListener((changes, area) => {
    console.log(changes, area);
    if (changes.selectors) {
        const newKeys = Object.keys(changes.selectors.newValue ?? {});
        const oldKeys = Object.keys(changes.selectors.oldValue ?? {});

        if (newKeys.length !== oldKeys.length) {
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
        } else {
            Object.entries(changes.selectors.newValue).forEach(([key, selector]) => {
                const newValueChecked = selector.checked;
                const oldValueChecked = changes.selectors.oldValue[key].checked;

                if (!newValueChecked && oldValueChecked) {
                    replaceNode(selector);
                }
            });
        }
    }
});

function replaceNode(selector) {
    const element = document.querySelector(selector.value);
    const parent = element.parentNode;

    element.remove();
    parent.appendChild(cachedNodes[selector.id]);
}

async function getCachedNodes() {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get('cachedNodes', (cacheNodes) => {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            resolve(cacheNodes);
        });
    });

}

function added(newKeys, oldKeys) {
    return newKeys.filter(key => !oldKeys.includes(key))[0] ?? null;
}

function removed(newKeys, oldKeys) {
    return oldKeys.filter(key => !newKeys.includes(key))[0] ?? null;
}


chrome.storage.sync.get('selectors', ({ selectors }) => {
    if (!selectors) {
        return;
    }

    Object.entries(selectors).forEach(([key, selector]) => {
        const action = selector.checked ? 'enable' : 'disable';
        chrome.runtime.sendMessage({ selector: selector.value, action: action }, function (response) {
            console.log(response);
        });
    });
});

const onDebuggerEnabled = (debuggerId) => {
    debuggerEnabled = true
}

const onAttach = (debuggerId) => {
    chrome.debugger.sendCommand(
        debuggerId, "Debugger.enable", {},
        onDebuggerEnabled.bind(null, debuggerId)
    );
}