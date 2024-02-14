// 运行在 Electron 主进程 下的插件入口
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

function log(...args) {
    console.log(`[text_to_speech]`, ...args);
}


const plugin_path = LiteLoader.plugins["text_to_speech"].path.plugin;
const data_path = LiteLoader.plugins.text_to_speech.path.data;
const settingsPath = path.join(plugin_path,"config/settings.json")

// 创建窗口时触发
module.exports.onBrowserWindowCreated = window => {
    // window 为 Electron 的 BrowserWindow 实例
    
}

ipcMain.handle(
    "LiteLoader.text_to_speech.getSettings",
    (event, message) => {
        try {
            const data = fs.readFileSync(settingsPath, "utf-8");
            const config = JSON.parse(data);
            return config;
        } catch (error) {
            log(error);
            return {};
        }
    }
);

ipcMain.handle(
    "LiteLoader.text_to_speech.setSettings",
    (event, content) => {
        try {
            const new_config = JSON.stringify(content);
            fs.writeFileSync(settingsPath, new_config, "utf-8");
        } catch (error) {
            log(error);
        }
    }
);

ipcMain.handle(
    'LiteLoader.text_to_speech.saveFile',
    (event, fileName, fileData) => {
        try {
            const filePath = path.join(data_path, fileName);
            const bufferData = Buffer.from(fileData);
            fs.writeFileSync(filePath, bufferData);
            return {res: "success", file: filePath};
        } catch (error) {
            log(error);
            return {res: "error", msg: error};
        }
    }
)