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
}, { readonly: true });
