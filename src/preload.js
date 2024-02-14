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
    // 监听主进程的保存文件响应
    saveFile: (fileName,fileData) => ipcRenderer.invoke('LiteLoader.text_to_speech.saveFile', fileName, fileData)
});