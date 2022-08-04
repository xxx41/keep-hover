const ADDER_TEXT_SELECTOR = '.popup__selector-adder > input[type=text]';
const ADDER_BUTTON_SELECTOR = '.popup__selector-adder > input[type=button]'
const SELECTORS_SELECTOR = '.popup__selectors';
const ADDER_SELECTOR = '.popup__selector-adder';

const verboseMode = document.querySelector('#verboseMode');
const global = { selectorId: 0, selectors: {}, isVerboseMode: false };

window.onload = () => init();

function init() {
    chrome.storage.sync.get('isVerboseMode', ({ isVerboseMode }) => {
        verboseMode.checked = isVerboseMode;
        global.isVerboseMode = isVerboseMode;
    });

    chrome.storage.sync.get('selectors', ({ selectors }) => {
        global.selectors = selectors;

        buildInitialSelectors(selectors);
        adderClickListener(selectors);
        verboseModeListener();
    });
}

function verboseModeListener() {
    verboseMode.onchange = (event) => {
        let isVerboseMode = event.target.checked
        global.isVerboseMode = isVerboseMode;
        chrome.storage.sync.set({ isVerboseMode });
    }
}

function adderClickListener(selectors) {
    const adder = document.querySelector(ADDER_TEXT_SELECTOR);
    const button = document.querySelector(ADDER_BUTTON_SELECTOR);

    button.onclick = () => {
        if (!adder.value) return;

        if (selectorHasAlreadyBeenAdded(selectors)) {
            log('warning', 'Selector has already been added');
        } else {
            const selector = createSelector(adder.value, selectors);
            disableOtherCheckboxes(selector);
            hoverElementBy(selector);
        }
    }
}

function selectorHasAlreadyBeenAdded(selectors) {
    return Object.values(selectors).filter(element => element.value === adder.value).length > 0;
}

function createSelector(selectorText, selectors = {}) {
    const id = appendSelector(selectorText);
    const selector = { id: id, value: selectorText, checked: true };
    selectors[id] = selector;
    global.selectors = selectors;
    chrome.storage.sync.set({ selectors });

    return selector;
}

function hoverElementBy(selector) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.runtime.sendMessage({ selector: selector, tab: tabs[0] }, (response) => {
            if (!response.success) {
                log('error', `Node not found for selector: ${selector.value}`);
            }
        });
    });
}

function removeHover() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.runtime.sendMessage({ action: 'remove', tab: tabs[0] }, (response) => {
            console.log(response)
        });
    });
}

function buildInitialSelectors(selectors) {
    global.selectorId = Object.values(selectors ?? []).length;
    Object.entries(selectors ?? []).forEach(([key, selector]) => {
        appendSelector(selector.value, key, selector.checked);
    });
}

function appendSelector(selectorText, selectorId = null, checked = true) {
    const selectors = document.querySelector(SELECTORS_SELECTOR);
    const adder = document.querySelector(ADDER_SELECTOR);
    const id = selectorId ?? generateId();

    selectors.insertBefore(createSelectorNode(selectorText, id, checked), adder);

    return id;
}

function createSelectorNode(selectorText, selectorId, checked) {
    const checkboxName = `ch${selectorId}`;

    const selectorElement = createElement('div', getSelectorNodeAttributes(selectorId));
    const checkboxElement = createElement('input', getSelectorCheckboxAttributes(checkboxName, checked));
    const labelElement = createElement('label', getSelectorLabelAttributes(checkboxName, selectorText));
    const deleteElement = createElement('button', getSelectorDeleteAttributes());

    checkboxOnchangeListener(checkboxElement);
    deleteOnclickListener(deleteElement);

    [checkboxElement, labelElement, deleteElement].forEach(element => {
        selectorElement.appendChild(element);
    });

    return selectorElement;
}

function createElement(tag, attributes = []) {
    const element = document.createElement(tag);
    attributes.forEach(attribute => {
        switch (attribute.attr) {
            case 'class':
                element.classList.add(attribute.value)
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
}

function getSelectorNodeAttributes(id) {
    return [
        { attr: 'id', value: id },
        { attr: 'class', value: 'popup__selector' }
    ];
}

function getSelectorCheckboxAttributes(name, checked = true) {
    return [
        { attr: 'type', value: 'checkbox' },
        { attr: 'id', value: name },
        { attr: 'checked', value: checked }
    ];
}

function getSelectorLabelAttributes(checkboxName, labelText) {
    return [
        { attr: 'innerText', value: labelText },
        { attr: 'for', value: checkboxName }
    ];
}

function getSelectorDeleteAttributes() {
    return [
        { attr: 'class', value: 'popup__selector-delete'}
    ];
}

function checkboxOnchangeListener(checkbox) {
    checkbox.onchange = (event) => {
        if (event.target.checked) {
            const selector = global.selectors[event.target.parentNode.id];
            global.selectors[event.target.parentNode.id].checked = true;
            const selectors = global.selectors;
            chrome.storage.sync.set({ selectors });
            disableOtherCheckboxes(selector);
            hoverElementBy(selector);
        } else {
            global.selectors[event.target.parentNode.id].checked = false;
            const selectors = global.selectors;
            chrome.storage.sync.set({ selectors });
            removeHover();
        }
    }
}

function deleteOnclickListener(deleteElement) {
    deleteElement.onclick = (event) => {
        const id = event.target.parentNode.id;
        if (global.selectors[id].checked) removeHover();
        delete global.selectors[id];
        event.target.parentNode.remove();
        let selectors = global.selectors;
        chrome.storage.sync.set({ selectors });
    }
}

function generateId() {
    return 'sel' + global.selectorId++;
}

function disableOtherCheckboxes(activeSelector) {
    Object.values(global.selectors).forEach(selector => {
        if (selector.id !== activeSelector.id) {
            let checkbox = document.querySelector(`#${selector.id} > input[type=checkbox]`);
            checkbox['checked'] = false;
            global.selectors[selector.id].checked = false;
            const selectors = global.selectors;
            chrome.storage.sync.set({ selectors });
        }
    });
}

function log(level, message) {
    if (!global.isVerboseMode) return;

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: consoleLog,
            args: [message, level]
        });
    });
}

function consoleLog(message, level) {
    console.log({ level: level, message: message });
}