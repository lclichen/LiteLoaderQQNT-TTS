// Electron 主进程 与 渲染进程 交互的桥梁
const { contextBridge, ipcRenderer } = require("electron");


// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("text_to_speech", {
    getSettings: () => ipcRenderer.invoke(
        "LiteLoader.text_to_speech.getSettings"
    ),
    setSettings: content => ipcRenderer.invoke(
        "LiteLoader.text_to_speech.setSettings",
        content
    ),
    openSettings: () => ipcRenderer.invoke(
        "LiteLoader.text_to_speech.openSettings"
    ),
    // 保存渲染进程获取的数据到数据目录下
    saveFile: (fileName, fileData) => ipcRenderer.invoke('LiteLoader.text_to_speech.saveFile', fileName, fileData),
    // 转换本地文件格式并保存到数据目录下
    convertAndSaveFile: (filePath) => ipcRenderer.invoke('LiteLoader.text_to_speech.convertAndSaveFile', filePath)
});