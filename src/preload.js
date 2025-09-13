const { contextBridge, ipcRenderer } = require("electron");

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("text_to_speech", {
    // 打开配置文件所在文件夹/打开配置文件
    openFileManager: (path) => ipcRenderer.invoke("LiteLoader.text_to_speech.openFileManager", path),
    // 保存渲染进程获取的数据到数据目录下
    saveFile: (fileName, fileData) => ipcRenderer.invoke('LiteLoader.text_to_speech.saveFile', fileName, fileData),
    // 转换本地文件格式并保存到数据目录下
    convertAndSaveFile: (filePath) => ipcRenderer.invoke('LiteLoader.text_to_speech.convertAndSaveFile', filePath),
    // 生成Silk格式的语音文件
    getSilk: (path) => ipcRenderer.invoke("LiteLoader.text_to_speech.getSilk", path),
    // 获得用于预览的base64音频数据
    readAudioAsBase64: (filePath) => ipcRenderer.invoke("LiteLoader.text_to_speech.readAudioAsBase64", filePath),
    // // 获得发送Ptt消息所需的信息
    // getPttFileInfo: (filePath) => ipcRenderer.invoke("LiteLoader.text_to_speech.getPttFileInfo", filePath),
    // 复制文件到缓存目录
    copyFileToCache: (oldPath, newPath) => ipcRenderer.invoke("LiteLoader.text_to_speech.copyFileToCache", oldPath, newPath),
    // 获取子配置文件
    getSubOptions: (subConfigName) => ipcRenderer.invoke("LiteLoader.text_to_speech.getSubOptions", subConfigName),
    // 更新子配置文件
    setSubOptions: (subConfigName, options) => ipcRenderer.invoke("LiteLoader.text_to_speech.setSubOptions", subConfigName, options),
    // 加载子配置模板列表
    getSubOptionsList: (force_refresh) => ipcRenderer.invoke("LiteLoader.text_to_speech.getSubOptionsList", force_refresh),
    // 获取本地可用子配置列表
    getLocalSubOptionsList: () => ipcRenderer.invoke("LiteLoader.text_to_speech.getLocalSubOptionsList"),
    // 加载子配置模板
    fetchSubOptions: (subConfigName, url) => ipcRenderer.invoke("LiteLoader.text_to_speech.fetchSubOptions", subConfigName, url),
    // 子配置重命名
    renameSubOptions: (oldName, newName) => ipcRenderer.invoke("LiteLoader.text_to_speech.renameSubOptions", oldName, newName),

    // 获取窗口Id
    getWebContentId: () => ipcRenderer.sendSync("LiteLoader.text_to_speech.getWebContentId"),

    nativeCall: (event, payload, awaitCallback) => {
        const callbackId = crypto.randomUUID();
        const webContentId = ipcRenderer.sendSync("LiteLoader.text_to_speech.getWebContentId");
        let resolve;
        if (awaitCallback) {
            resolve = new Promise((res) => {
                function onEvent(...args) {
                    if (typeof awaitCallback === "boolean") {
                        if (args[1]?.callbackId === callbackId) {
                            ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
                            res(args[2]);
                        }
                    } else if (Array.isArray(awaitCallback)) {
                        if (awaitCallback.includes(args?.[1]?.cmdName)) {
                            ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
                            res(args[2]);
                        }
                    } else {
                        if (args?.[2]?.cmdName === awaitCallback) {
                            ipcRenderer.off(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
                            res(args[2]);
                        }
                    }
                }
                ipcRenderer.on(`RM_IPCFROM_MAIN${webContentId}`, onEvent);
            });
        } else {
            resolve = Promise.resolve(null);
        }
        ipcRenderer.send(
            `RM_IPCFROM_RENDERER${webContentId}`,
            {
                peerId: webContentId,
                callbackId,
                ...event,
            },
            payload,
        );
        return resolve;
    },
}, { readonly: true });
