interface Selector {
    id: number,
    value: string,
    checked: boolean
}

interface Selectors {
    [P: string]: Selector
}

interface ExtensionOptions {
    selectors?: Selectors,
    isVerboseMode?: boolean
}

interface OnHoverResult {
    success: boolean,
    message?: string
}

interface PopupVariables {
    selectorId: number,
    selectors: Selectors,
    isVerboseMode: boolean
}

interface HTMLElementAttributes {
    attr: string,
    value: any
}

class Content {
    init(): void {
        this.hoverInitialIfNecessary();
    }

    hoverInitialIfNecessary(): void {
        chrome.storage.sync.get('selectors', ({ selectors }) => {
            Object.values(<Selectors>selectors ?? {}).forEach((selector: Selector): void => {
                if (selector.checked) this.hoverElementBy(selector);
            });
        });
    }

    hoverElementBy(selector: Selector) {
        chrome.runtime.sendMessage({ selector: selector }, (response): void => {
            //TODO: remove console log
            console.log(response);
        });
    }
}

const content = new Content();
content.init();

