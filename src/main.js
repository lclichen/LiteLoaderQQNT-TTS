// 运行在 Electron 主进程 下的插件入口
const { ipcMain } = require("electron");
const fs = require("fs");
const os = require('os');
const path = require("path");
const util = require('util');
const exec = util.promisify(require("child_process").exec);
const { encode, getDuration } = require("../silk-wasm");

const logger = {
    info: function (...args) {
        console.log(`[Text_to_speech]`, ...args);
    },
    warn: function (...args) {
        console.warn(`[Text_to_speech]`, ...args);
    },
    error: function (...args) {
        console.error(`[Text_to_speech]`, ...args);
        // alert(`[Text_to_speech]` + args.join(" "));
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

const simpleFile = path.join(LiteLoader.plugins["text_to_speech"].path.plugin, "config", "config.json");
const dataPath = LiteLoader.plugins["text_to_speech"].path.data;
const pttPath = path.join(dataPath, "ptt");
const configFile = path.join(LiteLoader.plugins["text_to_speech"].path.data, "config.json");
const optionsListFile = path.join(LiteLoader.plugins["text_to_speech"].path.data, "options_list.json")
const subConfigFolderPath = path.join(LiteLoader.plugins["text_to_speech"].path.data, "subconfigs");

module.exports.onBrowserWindowCreated = (window) => {
    // 创建数据文件夹
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }
    // 在数据文件夹中创建语音临时文件目录
    if (!fs.existsSync(pttPath)) {
        fs.mkdirSync(pttPath, { recursive: true });
    }
    if (!fs.existsSync(subConfigFolderPath)) {
        fs.mkdirSync(subConfigFolderPath, { recursive: true });
        // 在数据文件夹中创建配置文件
        if (!fs.existsSync(configFile)) {
            fs.copyFileSync(simpleFile, configFile);
            fs.copyFileSync(simpleSubFile, path.join(subConfigFolderPath, "default.json"));
        }
        // 将旧配置文件备份后创建新配置文件
        else {
            let oldOptions = JSON.parse(fs.readFileSync(configFile, "utf-8"));
            fs.copyFileSync(configFile, path.join(LiteLoader.plugins["text_to_speech"].path.data, "config_backup.json"));
            let defaultOptions = {
                "host": oldOptions.host,
                "host_type": oldOptions.host_type,
                "params": oldOptions.default_params[oldOptions.host_type],
            }
            fs.writeFileSync(path.join(subConfigFolderPath, "default.json"), JSON.stringify(defaultOptions, null, 2));
            fs.copyFileSync(simpleFile, configFile);
        }
    }
    // 读取子配置文件夹下的可用配置文件，生成可用配置列表
    let mainOptions = JSON.parse(fs.readFileSync(configFile, "utf-8"));
    try {
        // 同步读取文件夹中的所有文件
        const files = fs.readdirSync(subConfigFolderPath, { withFileTypes: true });
        // 过滤出.json文件，并生成不含扩展名的文件名列表
        const jsonFilesNames = files
            .filter(file => path.extname(file.name) === '.json')
            .map(file => path.basename(file.name, '.json'));
        mainOptions.availableOptions = jsonFilesNames;
        fs.writeFileSync(configFile, JSON.stringify(mainOptions, null, 2), "utf-8");
    } catch (err) {
        logger.error('无法读取文件夹:', err);
    }
};

async function openFileManager(path) {
    let command;
    switch (os.platform()) {
        case 'win32':
            command = `start "" "${path}"`;
            break;
        case 'darwin':
            command = `open "${path}"`;
            break;
        case 'linux':
            command = `xdg-open "${path}"`;
            break;
        default:
            throw new Error('Unsupported platform:', os.platform());
    }

    try {
        const { stdout, stderr } = await exec(command);
        logger.info('File manager opened successfully.');
        if (stderr) {
            logger.error('Stderr:', stderr);
        }
    } catch (error) {
        logger.error('Error:', error);
    }
}

function getFileHeader(filePath) {
    // 定义要读取的字节数
    const bytesToRead = 7;
    try {
        const buffer = fs.readFileSync(filePath, {
            encoding: null,
            flag: "r",
            length: bytesToRead,
        });

        const fileHeader = buffer.toString("hex", 0, bytesToRead);
        return fileHeader;
    } catch (err) {
        logger.error("读取文件错误:", err);
        return;
    }
}

ipcMain.handle("LiteLoader.text_to_speech.getSilk", async (event, filePath) => {
    try {
        const fileName = `${path.basename(filePath)}.silk`;
        const pcm = fs.readFileSync(filePath);
        if (getFileHeader(filePath) !== "02232153494c4b") {
            const silk = await encode(pcm, 24000);
            fs.writeFileSync(`${pttPath}/${fileName}`, silk.data);
            return {
                path: `${pttPath}/${fileName}`,
                duration: silk.duration,
            };
        } else {
            const duration = getDuration(pcm);
            return {
                path: filePath,
                duration: duration,
            };
        }
    } catch (error) {
        logger.error(error);
        return { res: "error", msg: error };
    }
});

ipcMain.handle(
    // 打开配置文件所在文件夹/打开配置文件
    "LiteLoader.text_to_speech.openFileManager",
    async (event, path) => {
        try {
            await openFileManager(path);
        } catch (error) {
            logger.error(error);
        }
    }
);

ipcMain.handle(
    "LiteLoader.text_to_speech.getLocalSubOptionsList",
    async (event) => {
        // 读取子配置文件夹下的可用配置文件，生成可用配置列表
        // 同步读取文件夹中的所有文件
        const files = fs.readdirSync(subConfigFolderPath, { withFileTypes: true });
        // 过滤出.json文件，并生成不含扩展名的文件名列表
        const jsonFilesNames = files
            .filter(file => path.extname(file.name) === '.json')
            .map(file => path.basename(file.name, '.json'));
        return jsonFilesNames;
    }
)

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
                return { res: "success", file: `${filePath}.wav`, origin: filePath};
            }
            else {
                return { res: "success", file: filePath, origin: filePath};
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
                return { res: "success", file: `${fileNewPath}.wav`, origin: filePath};
            }
            else {
                fs.copyFileSync(filePath, fileNewPath);
                return { res: "success", file: filePath, origin: filePath};
            }
        } catch (error) {
            logger.error(error);
            return { res: "error", msg: error };
        }
    }
)

function extractValidFilenamePart(inputString) {
    // 定义不能用于文件名的字符
    const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g;
    // 替换掉无效字符
    const validPart = inputString.replace(invalidChars, '_');
    return validPart.trim();
}

async function loadConfigFromWeb(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Failed to load config from ${url}:`, error);
        return null;
    }
}

function updateSubConfig(subConfigName, newConfig) {
    const subConfigPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(subConfigName)}.json`);
    fs.writeFileSync(subConfigPath, JSON.stringify(newConfig, null, 2));
}

ipcMain.handle("LiteLoader.text_to_speech.getSubOptions", async (event, subConfigName) => {
    const subConfigPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(subConfigName)}.json`);
    const subOptions = fs.readFileSync(subConfigPath, "utf-8");
    return JSON.parse(subOptions);
});

ipcMain.handle("LiteLoader.text_to_speech.setSubOptions", async (event, subConfigName, newConfig) => {
    const subConfigPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(subConfigName)}.json`);
    fs.writeFileSync(subConfigPath, JSON.stringify(newConfig, null, 2));
});

ipcMain.handle("LiteLoader.text_to_speech.getSubOptionsList", async (event, force_refresh) => {
    if (force_refresh || !fs.existsSync(optionsListFile)) {
        const optionsList = await loadConfigFromWeb('https://tts.marblue.cn/options_list.json');
        fs.writeFileSync(optionsListFile, JSON.stringify(optionsList, null, 2));
        return optionsList;
    } else {
        const optionsList = fs.readFileSync(optionsListFile, "utf-8");
        return JSON.parse(optionsList);
    }
});

ipcMain.handle("LiteLoader.text_to_speech.fetchSubOptions", async (event, subConfigName, url) => {
    if(fs.existsSync(`${extractValidFilenamePart(subConfigName)}.json`)) {
        const subOptions = fs.readFileSync(subConfigName, "utf-8");
        return JSON.parse(subOptions);
    } else {
        const newConfig = await loadConfigFromWeb(url);
        if (newConfig) {
            const subConfigPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(subConfigName)}.json`);
            fs.writeFileSync(subConfigPath, JSON.stringify(newConfig, null, 2));
        } else {
            console.error(`Failed to update subConfig ${subConfigName} due to failed fetching.`);
        }
        return newConfig;
    }
});

ipcMain.handle("LiteLoader.text_to_speech.renameSubOptions", async (_, oldName, newName) => {
    const oldPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(oldName)}.json`);
    const newPath = path.join(subConfigFolderPath, `${extractValidFilenamePart(newName)}.json`);
    fs.renameSync(oldPath, newPath);
});