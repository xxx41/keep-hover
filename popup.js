const ADDER_TEXT_SELECTOR = '.popup__selector-adder > input[type=text]';
const ADDER_BUTTON_SELECTOR = '.popup__selector-adder > input[type=button]'
const SELECTORS_SELECTOR = '.popup__selectors';
const ADDER_SELECTOR = '.popup__selector-adder';

const debugMode = document.querySelector('#debugMode');
const global = {
    selectorId: 0,
    selectors: {}
}

window.onload = () => init();

function init() {
    chrome.storage.sync.get('isDebugMode', ({ isDebugMode }) => {
        debugMode.checked = isDebugMode;
    });

    chrome.storage.sync.get('selectors', ({ selectors }) => {
        global.selectors = selectors;

        buildInitialSelectors(selectors);
        adderClickListener(selectors);
    });
}

function adderClickListener(selectors) {
    const adder = document.querySelector(ADDER_TEXT_SELECTOR);
    const button = document.querySelector(ADDER_BUTTON_SELECTOR);

    button.onclick = () => {
        if (!adder.value) return;

        const selector = createSelector(adder.value, selectors);
        hoverElementBy(selector);
    }
}

function createSelector(selectorText, selectors) {
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
            console.log(response)
        });
    });
}

function buildInitialSelectors(selectors) {
    global.selectorId = Object.values(selectors).length;
    Object.entries(selectors).forEach(([key, selector]) => {
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
        (attribute.attr === 'class')
            ? element.classList.add(attribute.value)
            : element[attribute.attr] = attribute.value;
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
        { attr: 'name', value: name },
        { attr: 'checked', value: checked }
    ];
}

function getSelectorLabelAttributes(checkboxName, labelText) {
    return [
        { attr: 'innerText', value: labelText },
        { attr: 'for', value: checkboxName }
    ]
}

function getSelectorDeleteAttributes() {
    return [
        { attr: 'class', value: 'popup__selector-delete'}
    ];
}

function checkboxOnchangeListener(checkbox) {
    checkbox.onchange = (event) => {
        // TODO: refactor
        const selector = global.selectors[event.target.parentNode.id].value;
        const action = event.target.checked ? 'enable' : 'disable';
        global.selectors[event.target.parentNode.id].checked = event.target.checked;

        const selectors = global.selectors;
        chrome.storage.sync.set({ selectors });
        hoverElementBy(selector);
    }
}

function deleteOnclickListener(deleteElement) {
    deleteElement.onclick = (event) => {
        const id = parent.id;
        delete global.selectors[id];
        parent.remove();

        let selectors = global.selectors;
        chrome.storage.sync.set({ selectors });
    }
}

function generateId() {
    return 'sel' + global.selectorId++;
}