// 运行在 Electron 主进程 下的插件入口
const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const util = require('util');
const exec = util.promisify(require("child_process").exec);

function log(...args) {
    console.log(`[text_to_speech]`, ...args);
}

async function convertToPcm(file, fileOutput) {
    try {
        var { stderr } = await exec(`ffmpeg -y -i "${ file }" -acodec pcm_s16le -f s16le -ac 1 "${ fileOutput }.pcm" -loglevel error`);
        if (stderr) {
            return `An error occurred while converting ${ file } to .pcm. Details: ${ stderr }`;
        }
        var { stdout, stderr } = await exec(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "${ file }"`);
        if (stderr) {
            return `An error occurred while obtaining the sample rate. Details: ${ stderr }`;
        }
    } catch (error) {
        return `An unknown error occurred. Details: ${ error }`;
    }
}

const plugin_path = LiteLoader.plugins["text_to_speech"].path.plugin;
const data_path = LiteLoader.plugins.text_to_speech.path.data;
const settingsPath = path.join(plugin_path,"config/settings.json")

// 创建窗口时触发
module.exports.onBrowserWindowCreated = window => {
    // window 为 Electron 的 BrowserWindow 实例
    // 创建数据存储文件夹
    if (!fs.existsSync(data_path)) {
        fs.mkdirSync(data_path, { recursive: true });
    }
}

ipcMain.handle(
    // 读取配置文件
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
    // 保存配置文件
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
    // 保存渲染进程获取的数据到数据目录下
    'LiteLoader.text_to_speech.saveFile',
    async (event, fileName, fileData) => {
        try {
            const filePath = path.join(data_path, fileName);
            const bufferData = Buffer.from(fileData);
            fs.writeFileSync(filePath, bufferData);
            const ext = path.extname(filePath);
            if (![".silk",".wav",".pcm"].includes(ext)) {
                let error = await convertToPcm(filePath, filePath)
                if (error) {
                    log(error);
                    return {res: "error", msg: error};
                }
                return {res: "success", file: `${ filePath }.pcm`};
            }
            else {
                return {res: "success", file: filePath};
            }
        } catch (error) {
            log(error);
            return {res: "error", msg: error};
        }
    }
)

ipcMain.handle(
    // 转换本地文件格式并保存到数据目录下
    'LiteLoader.text_to_speech.convertAndSaveFile',
    async (event, filePath) => {
        try {
            const fileName = path.basename(filePath);
            const fileNewPath = path.join(data_path, fileName);
            const ext = path.extname(filePath);
            if (![".silk",".wav",".pcm"].includes(ext)) {
                let error = await convertToPcm(filePath, fileNewPath)
                if (error) {
                    log(error);
                    return {res: "error", msg: error};
                }
                return {res: "success", file: `${ fileNewPath }.pcm`};
            }
            else {
                fs.copyFileSync(filePath, fileNewPath);
                return {res: "success", file: fileNewPath};
            }
        } catch (error) {
            log(error);
            return {res: "error", msg: error};
        }
    }
)