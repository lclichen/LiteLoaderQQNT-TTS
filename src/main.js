const { ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const logger = {
    info: function (...args) {
        console.log(`[Text_to_speech]`, ...args);
    },
    warn: function (...args) {
        console.warn(`[Text_to_speech]`, ...args);
    },
    error: function (...args) {
        console.error(`[Text_to_speech]`, ...args);
        alert(`[Text_to_speech]` + args.join(" "));
    }
};

async function convertToWAV(file, fileOutput) {
    try {
        var { stderr } = await exec(`ffmpeg -y -i "${file}" -acodec pcm_s16le -f s16le -ac 1 -ar 24000 "${fileOutput}.wav" -loglevel error`);
        if (stderr) {
            return `An error occurred while converting ${file} to .wav. Details: ${stderr}`;
        }
        var { stdout, stderr } = await exec(`ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "${file}"`);
        if (stderr) {
            return `An error occurred while obtaining the sample rate. Details: ${stderr}`;
        }
    } catch (error) {
        return `An unknown error occurred. Details: ${error}`;
    }
}

const simpleFile = path.join(LiteLoader.plugins.text_to_speech.path.plugin, "config", "settings.json")
const configFile = path.join(LiteLoader.plugins.text_to_speech.path.data, "config.json")
const dataPath = LiteLoader.plugins.text_to_speech.path.data;

module.exports.onBrowserWindowCreated = (window) => {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }
    if (!fs.existsSync(configFile)) {
        fs.copyFileSync(simpleFile, configFile);
    }
};

ipcMain.handle(
    // 读取配置文件
    "LiteLoader.text_to_speech.getOptions",
    (event, message) => {
        try {
            const data = fs.readFileSync(configFile, "utf-8");
            const config = JSON.parse(data);
            return config;
        } catch (error) {
            logger.error(error);
            return {};
        }
    }
);

ipcMain.handle(
    // 打开配置文件所在文件夹/打开配置文件
    "LiteLoader.text_to_speech.openOptions",
    () => {
        try {
            LiteLoader.api.openPath(configFile);
        } catch (error) {
            logger.error(error);
        }
    }
);

ipcMain.handle(
    // 保存渲染进程获取的数据到数据目录下
    'LiteLoader.text_to_speech.saveFile',
    async (event, fileName, fileData) => {
        try {
            const filePath = path.join(dataPath, fileName);
            const bufferData = Buffer.from(fileData);
            fs.writeFileSync(filePath, bufferData);
            const ext = path.extname(filePath);
            if (![".silk"].includes(ext)) {
                let error = await convertToWAV(filePath, filePath)
                if (error) {
                    logger.error(error);
                    return { res: "error", msg: error };
                }
                return { res: "success", file: `${filePath}.wav` };
            }
            else {
                return { res: "success", file: filePath };
            }
        } catch (error) {
            logger.error(error);
            return { res: "error", msg: error };
        }
    }
)

ipcMain.handle(
    // 转换本地文件格式并保存到数据目录下
    'LiteLoader.text_to_speech.convertAndSaveFile',
    async (event, filePath) => {
        try {
            const fileName = path.basename(filePath);
            const fileNewPath = path.join(dataPath, fileName);
            const ext = path.extname(filePath);
            if (![".silk"].includes(ext)) {
                let error = await convertToWAV(filePath, fileNewPath)
                if (error) {
                    logger.error(error);
                    return { res: "error", msg: error };
                }
                return { res: "success", file: `${fileNewPath}.wav` };
            }
            else {
                fs.copyFileSync(filePath, fileNewPath);
                return { res: "success", file: filePath };
            }
        } catch (error) {
            logger.error(error);
            return { res: "error", msg: error };
        }
    }
)