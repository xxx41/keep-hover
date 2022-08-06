let selectors: Selectors = {};
let isVerboseMode: boolean = false;
let isDebuggerAttached: boolean = false;

class Background {
    init(): void {
        this.getAllStorageSyncData().then(storageData => {
            selectors = storageData.selectors ?? {};
            isVerboseMode = storageData.isVerboseMode ?? false;
        });
        this.addOnInstalledListener();
        this.addOnMessageListener();
    }

    getAllStorageSyncData(): Promise<ExtensionOptions> {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.get(null, (items) => {
                if (chrome.runtime.lastError) {
                    return reject(chrome.runtime.lastError);
                }
                resolve(items);
            });
        });
    }

    addOnInstalledListener(): void {
        chrome.runtime.onInstalled.addListener(() => {
            chrome.storage.sync.set({ selectors, isVerboseMode });
        });
    }

    addOnMessageListener(): void {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            const tabId = request.tab ? request.tab.id : sender.tab?.id;

            if (!tabId) {
                // TODO: log error
                return true;
            }

            if (request.action === 'remove') {
                this.disableCss(tabId)
                    .then(() => sendResponse({ success: true }));
                return true;
            }

            if (!isDebuggerAttached) {
                let debuggerId = { tabId };
                chrome.debugger.attach(debuggerId, "1.1");
                isDebuggerAttached = true;
            }

            this.hoverOnElement(request.selector, tabId)
                .then(response => sendResponse(response));

            return true;
        });
    }

    async disableCss(tabId: number): Promise<any> {
        return chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.disable')
    }

    async hoverOnElement(
        selector: Selector,
        tabId: number
    ): Promise<OnHoverResult> {

        chrome.debugger.sendCommand({ tabId: tabId }, 'DOM.enable')
        chrome.debugger.sendCommand({ tabId: tabId }, 'CSS.enable')

        const getDocumentResult: any = await chrome.debugger.sendCommand(
            { tabId: tabId },
            "DOM.getDocument"
        )

        if (!getDocumentResult?.root?.nodeId) {
            return { success: false, message: 'Document node id not found'};
        }

        const querySelectorResult: any = await chrome.debugger.sendCommand(
            { tabId: tabId },
            "DOM.querySelector",
            { nodeId: getDocumentResult.root.nodeId, selector: `${selector.value}` }
        );

        if (!querySelectorResult?.nodeId || querySelectorResult.nodeId === 0) {
            return {
                success: false,
                message: `Node not found for selector: ${selector.value}`
            };
        }

        await chrome.debugger.sendCommand(
            { tabId: tabId },
            "CSS.forcePseudoState",
            { nodeId: querySelectorResult.nodeId, forcedPseudoClasses: ['hover'] }
        );

        return { success: true };
    }
}

new Background().init();