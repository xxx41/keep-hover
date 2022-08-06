const ADDER_SELECTOR: string = '.popup__selector-adder';
const SELECTORS_SELECTOR: string = '.popup__selectors';
const ADDER_TEXT_SELECTOR: string = '.popup__selector-adder > input[type=text]';
const ADDER_BUTTON_SELECTOR: string = '.popup__selector-adder > input[type=button]'

let verboseMode: HTMLInputElement|null;
const global: PopupVariables = {
    selectorId: 0,
    selectors: {},
    isVerboseMode: false
};

class Popup {

    init(): void {
        verboseMode = document.querySelector('#verboseMode');

        chrome.storage.sync.get('isVerboseMode', ({ isVerboseMode }) => {
            verboseMode!.checked = isVerboseMode;
            global.isVerboseMode = isVerboseMode;
        });

        chrome.storage.sync.get('selectors', ({ selectors }) => {
            global.selectors = selectors;

            this.buildInitialSelectors(selectors);
            this.adderClickListener(selectors);
            this.verboseModeListener();
        });
    }

    verboseModeListener(): void {
        verboseMode!.onchange = (event: Event) => {
            const element = event.target as HTMLInputElement;
            let isVerboseMode = element.checked;
            global.isVerboseMode = isVerboseMode;
            chrome.storage.sync.set({ isVerboseMode });
        }
    }

    adderClickListener(selectors: Selectors): void {
        const adder = document.querySelector(
            ADDER_TEXT_SELECTOR) as HTMLInputElement;
        const button = document.querySelector(
            ADDER_BUTTON_SELECTOR) as HTMLElement;

        button!.onclick = () => {
            if (!adder.value) return;

            if (this.selectorHasAlreadyBeenAdded(selectors, adder.value)) {
                this.log('warning', 'Selector has already been added');
            } else {
                const selector = this.createSelector(adder.value, selectors);
                this.disableOtherCheckboxes(selector);
                this.hoverElementBy(selector);
            }
        }
    }

    selectorHasAlreadyBeenAdded(
        selectors: Selectors,
        value: string
    ): boolean {
        return Object.values(selectors).filter(
            element => element.value === value
        ).length > 0;
    }

    createSelector(
        selectorText: string,
        selectors: Selectors = {}
    ): Selector {
        const id = this.appendSelector(selectorText);
        const selector: Selector = {
            id: parseInt(id),
            value: selectorText,
            checked: true
        };
        selectors[id] = selector;
        global.selectors = selectors;
        chrome.storage.sync.set({ selectors });

        return selector;
    }

    hoverElementBy(selector: Selector): void {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.runtime.sendMessage({
                selector: selector,
                tab: tabs[0]
            }, (response) => {
                if (!response.success) {
                    this.log('error', `Node not found for selector: ${selector.value}`);
                }
            });
        });
    }

    removeHover(): void {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.runtime.sendMessage({
                    action: 'remove',
                    tab: tabs[0]
            }, (response) => console.log(response));
        });
    }

    buildInitialSelectors(selectors: Selectors): void {
        global.selectorId = Object.values(selectors ?? []).length;
        Object.entries(selectors ?? []).forEach(([key, selector]) => {
            this.appendSelector(selector.value, parseInt(key), selector.checked);
        });
    }

    appendSelector(
        selectorText: string,
        selectorId: number|null = null,
        checked = true
    ): string {
        const selectors = document.querySelector(SELECTORS_SELECTOR) as HTMLElement;
        const adder = document.querySelector(ADDER_SELECTOR) as HTMLElement;
        const id = selectorId ? selectorId.toString() : this.generateId();

        selectors.insertBefore(
            this.createSelectorNode(selectorText, id, checked), adder);

        return id.toString();
    }

    createSelectorNode(
        selectorText: string,
        selectorId: string,
        checked: boolean
    ): HTMLElement {
        const checkboxName = `ch${selectorId}`;

        const selectorElement = this.createElement(
            'div', this.getSelectorNodeAttributes(selectorId));
        const checkboxElement = this.createElement(
            'input', this.getSelectorCheckboxAttributes(checkboxName, checked)
        ) as HTMLInputElement;
        const labelElement = this.createElement(
            'label', this.getSelectorLabelAttributes(checkboxName, selectorText));
        const deleteElement = this.createElement(
            'button', this.getSelectorDeleteAttributes());

        this.checkboxOnchangeListener(checkboxElement);
        this.deleteOnclickListener(deleteElement);

        [checkboxElement, labelElement, deleteElement].forEach(element => {
            selectorElement.appendChild(element);
        });

        return selectorElement;
    }

    createElement(
        tag: string,
        attributes: Array<HTMLElementAttributes> = []
    ): HTMLElement {
        const element = document.createElement(tag) as HTMLElement;
        attributes.forEach(attribute => {
            switch (attribute.attr) {
                case 'class':
                    element.classList.add(attribute.value)
                    break;
                case 'for':
                    element.setAttribute('for', attribute.value);
                    break;
                default:
                    (element as any)[attribute.attr] = attribute.value;
                    break;
            }
        });

        return element;
    }

    getSelectorNodeAttributes(id: string): Array<HTMLElementAttributes> {
        return [
            { attr: 'id', value: id },
            { attr: 'class', value: 'popup__selector' }
        ];
    }

    getSelectorCheckboxAttributes(
        name: string,
        checked = true
    ): Array<HTMLElementAttributes> {
        return [
            { attr: 'type', value: 'checkbox' },
            { attr: 'id', value: name },
            { attr: 'checked', value: checked }
        ];
    }

    getSelectorLabelAttributes(
        checkboxName: string,
        labelText: string
    ): Array<HTMLElementAttributes> {
        return [
            { attr: 'innerText', value: labelText },
            { attr: 'for', value: checkboxName }
        ];
    }

    getSelectorDeleteAttributes(): Array<HTMLElementAttributes> {
        return [
            { attr: 'class', value: 'popup__selector-delete'}
        ];
    }

    checkboxOnchangeListener(checkbox: HTMLInputElement): void {
        checkbox.onchange = (event) => {
            const element = event.target as HTMLInputElement;
            const parent = element.parentNode as HTMLElement;
            if (element.checked) {
                const selector = global.selectors[parent.id];
                global.selectors[parent.id].checked = true;
                const selectors = global.selectors;
                chrome.storage.sync.set({ selectors });
                this.disableOtherCheckboxes(selector);
                this.hoverElementBy(selector);
            } else {
                global.selectors[parent.id].checked = false;
                const selectors = global.selectors;
                chrome.storage.sync.set({ selectors });
                this.removeHover();
            }
        }
    }

    deleteOnclickListener(deleteElement: HTMLElement): void {
        deleteElement.onclick = (event) => {
            const element = event.target as HTMLInputElement;
            const parent = element.parentNode as HTMLElement;
            const id = parent.id;
            if (global.selectors[id].checked) this.removeHover();
            delete global.selectors[id];
            parent.remove();
            let selectors = global.selectors;
            chrome.storage.sync.set({ selectors });
        }
    }

    generateId(): string {
        return 'sel' + global.selectorId++;
    }

    disableOtherCheckboxes(activeSelector: Selector): void {
        Object.values(global.selectors).forEach(selector => {
            if (selector.id !== activeSelector.id) {
                let checkbox = document.querySelector(
                    `#${selector.id} > input[type=checkbox]`) as HTMLInputElement;
                checkbox['checked'] = false;
                global.selectors[selector.id].checked = false;
                const selectors = global.selectors;
                chrome.storage.sync.set({ selectors });
            }
        });
    }

    log(level: string, message: string) {
        if (!global.isVerboseMode) return;

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            const tabId = tabs[0] ? tabs[0].id : null;
            if (!tabId) {
                return;
            }

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: this.consoleLog,
                args: [message, level]
            });
        });
    }

    consoleLog(message: string, level: string) {
        console.log({ level: level, message: message });
    }
}

new Popup().init();