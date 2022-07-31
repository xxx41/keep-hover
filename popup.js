const debugMode = document.querySelector('#debugMode');
const global = {
    selectorId: 0,
    selectors: {},
    selectorIdPrefix: 'sel',
    action: {}
}

chrome.storage.sync.get('isDebugMode', ({ isDebugMode }) => {
    debugMode.checked = isDebugMode;
});

chrome.storage.sync.get('selectors', ({ selectors }) => {
    global.selectors = selectors;

    buildSelected(selectors);
    adderClickListener(selectors);
});

function adderClickListener(selectors) {
    const adder = document.querySelector('.popup__selector-adder > input[type=text]');
    const button = document.querySelector('.popup__selector-adder > input[type=button]');

    button.onclick = () => {
        if (adder.value) {
            const addedId = addSelector(adder.value);
            if (addedId !== false) {
                selectors[addedId] = { value: adder.value, checked: true, id: addedId };

                global.selectors = selectors;
                chrome.storage.sync.set({ selectors });

                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    chrome.runtime.sendMessage({ selector: adder.value, tab: tabs[0], action: 'enable' }, function (response) {
                        console.log(response);
                    });
                });
            }

        }
    }
}

function buildSelected(selectors) {
    global.selectorId = Object.values(selectors).length;
    Object.entries(selectors).forEach(([key, selector]) => {
        addSelector(selector.value, key, selector.checked);
    });
}

function addSelector(selector, key = null, checked = true) {
    if (!Object.values(global.selectorId).find(element => element == selector)) {
        const selectorsWrapper = document.querySelector('.popup__selectors');
        const adder = document.querySelector('.popup__selector-adder');
        const id = key ?? generateId();
        selectorsWrapper.insertBefore(getSelectorElement(selector, id, checked), adder)

        return id;
    }

    return false;
}

function getSelectorElement(selector, id, checked) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('popup__selector');
    wrapper.id = id;

    const checkboxName = 'ch_' + id;
    const checkbox = document.createElement('input');
    checkbox.setAttribute('type', 'checkbox');
    checkbox.setAttribute('name', checkboxName);
    if (checked) checkbox.setAttribute('checked', 'true');
    checkbox.onchange = (event) => {
        const selector = global.selectors[event.target.parentNode.id].value;
        const action = event.target.checked ? 'enable' : 'disable';
        global.selectors[event.target.parentNode.id].checked = event.target.checked;

        const selectors = global.selectors;
        chrome.storage.sync.set({ selectors });
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.runtime.sendMessage({ selector: selector, tab: tabs[0], action: action }, function (response) {
                console.log(response);
            });
        });
    }

    const selectorText = document.createElement('label');
    selectorText.innerText = selector;
    selectorText.setAttribute('for', checkboxName)

    const deleteAction = getDeleteAction();

    [checkbox, selectorText, deleteAction].forEach(element => {
        wrapper.appendChild(element);
    });

    return wrapper;
}

function getDeleteAction() {
    const actionDelete = document.createElement('button');
    actionDelete.classList.add('popup__selector-delete');
    actionDelete.onclick = (event) => deleteSelector(event.target.parentNode);

    return actionDelete;
}

function deleteSelector(parent) {
    const id = parent.id;
    delete global.selectors[id];
    parent.remove();

    let selectors = global.selectors;
    chrome.storage.sync.set({ selectors });
}

function generateId() {
    return global.selectorIdPrefix + global.selectorId++;
}