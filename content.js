let cachedNodes = {};

window.onload = () => init();

function init() {
    getCachedNodes().then(nodes => { cachedNodes = { ...nodes } });
    hoverInitialIfNecessary();
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

function hoverInitialIfNecessary() {
    chrome.storage.sync.get('selectors', ({ selectors }) => {
        Object.values(selectors ?? []).forEach(selector => {
            if (selector.checked) hoverElementBy(selector);
        });
    });
}

function hoverElementBy(selector) {
    chrome.runtime.sendMessage({ selector: selector }, function (response) {
        console.log(response);
    });
}