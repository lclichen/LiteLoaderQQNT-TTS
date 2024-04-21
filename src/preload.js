const { contextBridge, ipcRenderer } = require("electron");

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("text_to_speech", {
    // 打开配置文件所在文件夹/打开配置文件
    openFileManager: (path) => ipcRenderer.invoke("LiteLoader.text_to_speech.openFileManager", path),
    // 保存渲染进程获取的数据到数据目录下
    saveFile: (fileName, fileData) => ipcRenderer.invoke('LiteLoader.text_to_speech.saveFile', fileName, fileData),
    // 转换本地文件格式并保存到数据目录下
    convertAndSaveFile: (filePath) => ipcRenderer.invoke('LiteLoader.text_to_speech.convertAndSaveFile', filePath),
    // 由于LLAPI暂停更新了，暂时尝试解除对LLAPI的依赖
    getSilk: (path) => ipcRenderer.invoke("LiteLoader.text_to_speech.getSilk", path),
}, { readonly: true });
