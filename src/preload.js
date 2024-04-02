const { contextBridge, ipcRenderer } = require("electron");

// 在window对象下导出只读对象
contextBridge.exposeInMainWorld("text_to_speech", {
    // 读取全部配置
    getOptions: () => ipcRenderer.invoke("LiteLoader.text_to_speech.getOptions"),
    // 打开配置文件所在文件夹/打开配置文件
    openOptions: () => ipcRenderer.invoke("LiteLoader.text_to_speech.openOptions"),
    // 保存渲染进程获取的数据到数据目录下
    saveFile: (fileName, fileData) => ipcRenderer.invoke('LiteLoader.text_to_speech.saveFile', fileName, fileData),
    // 转换本地文件格式并保存到数据目录下
    convertAndSaveFile: (filePath) => ipcRenderer.invoke('LiteLoader.text_to_speech.convertAndSaveFile', filePath)
}, { readonly: true });
