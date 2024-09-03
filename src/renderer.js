// 导入 https://github.com/xtaw/LiteLoaderQQNT-Euphony 作为 LLAPI 的替代
import { Contact, Audio } from '../LiteLoaderQQNT-Euphony/src/index.js';

// 运行在 Electron 渲染进程 下的页面脚本
const pluginPath = LiteLoader.plugins["text_to_speech"].path.plugin;
let optionsList = null;
let mainOption = null;
let currentOption = null;

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

function callTTS(sourceText, targetLang, optionsCache) {
    logger.info("转换文本：", sourceText, "到(语言)：", targetLang);
    logger.info("optionsCache: ", optionsCache);
    let params = optionsCache.params;
    params[params.source_key] = sourceText;
    const url = new URL(optionsCache.host);
    let searchParams = new URLSearchParams(params);
    let searchParamsInURL = new URLSearchParams(url.search);
    searchParamsInURL.forEach((value, key) => {
        searchParams.append(key, value);
    });
    url.search = searchParams;
    return fetch(url).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error, status = ${response.status}`);
        }
        return response.arrayBuffer();
    })
}


// 点击群助手后chat-func-bar会消失，再点群聊才会出现，所以需要再写一个监听
function observeElement2(selector, callback, callbackEnable = true, interval = 100) {
    try {
        const timer = setInterval(function () {
            const element = document.querySelector(selector);
            if (element) {
                if (callbackEnable) {
                    callback();
                }
            }
        }, interval);
    } catch (error) {
        logger.error("[检测元素错误]", error);
    }
}

// 渲染动态参数的函数
function renderParams(view, optionsEditing) {
    const paramsContainer = view.querySelector(".text_to_speech .params-container");
    paramsContainer.innerHTML = ''; // 清空现有参数

    Object.keys(optionsEditing.params || {}).forEach(paramKey => {
        const paramValue = optionsEditing.params[paramKey];

        const paramElement = document.createElement("setting-item");
        paramElement.classList.add("param-entry");
        paramElement.setAttribute("data-direction", "row");

        paramElement.innerHTML = `
            <div class="input-group">
            <input class="param-key" type="text" value="${paramKey}" readonly />
            <input class="param-value" type="text" value="${paramValue}" />
            <div class="ops-btns">
                <setting-button data-type="secondary" class="param-remove">移除参数</setting-button>
            </div>
            </div>
        `;

        paramsContainer.appendChild(paramElement);

        // 添加删除按钮事件
        paramElement.querySelector(".param-remove").addEventListener("click", () => {
            delete optionsEditing.params[paramKey];
            renderParams(view, optionsEditing); // 重新渲染
        });

        // 更新参数值
        paramElement.querySelector(".param-value").addEventListener("input", (e) => {
            optionsEditing.params[paramKey] = e.target.value;
        });
    });
}

const icon = `<svg fill="currentColor" stroke="" stroke-width="1.5" viewBox="0 0 1092 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M1010.551467 424.925867c0 86.016-65.365333 155.886933-147.0464 166.638933H819.882667c-81.681067-10.752-147.0464-80.622933-147.0464-166.638933H580.266667c0 123.630933 92.603733 231.1168 212.411733 252.6208V785.066667h87.176533v-107.52C999.662933 656.042667 1092.266667 553.915733 1092.266667 424.96h-81.7152z m-76.253867-231.150934C934.2976 140.014933 890.743467 102.4 841.728 102.4a91.204267 91.204267 0 0 0-92.603733 91.374933v91.374934h190.634666V193.774933h-5.461333z m-190.634667 231.150934c0 53.76 43.588267 91.374933 92.603734 91.374933a91.204267 91.204267 0 0 0 92.603733-91.374933V333.550933h-185.207467v91.374934zM464.213333 150.698667L324.266667 10.24l-6.826667-6.826667L314.026667 0l-3.413334 3.413333-6.826666 6.8608-20.48 20.548267-3.413334 3.413333 3.413334 6.8608 13.653333 13.687467 75.093333 75.3664H218.453333c-122.88 6.826667-218.453333 109.568-218.453333 229.444267v10.274133h51.2v-10.24c0-92.501333 75.093333-171.281067 167.253333-178.107733h153.6L296.96 256.853333l-10.24 10.274134-3.413333 6.826666-3.413334 3.447467 3.413334 3.413333 27.306666 27.409067 3.413334 3.413333 3.413333-3.413333 30.72-30.8224 116.053333-116.4288 3.413334-3.413333-3.413334-6.8608zM58.026667 534.254933v130.1504h64.853333v-65.058133h129.706667v359.594667H187.733333V1024h194.56v-65.058133H317.44V599.3472h129.706667v65.058133H512v-130.1504H58.026667z"></path></svg>`

observeElement2(".chat-func-bar", function () {
    // 获取消息栏的左侧图标区域（就是chat-func-bar的第一个子元素）
    const iconBarLeft = document.querySelector(".chat-func-bar").firstElementChild;

    // 判断是否已经添加过tts-bar-icon
    if (iconBarLeft.querySelector("#tts-bar-icon")) {
        return;
    }

    // 复制iconBarLeft的第一个子元素
    // const barIcon = iconBarLeft.firstElementChild.cloneNode(true);
    const barIcon = iconBarLeft.querySelector(".bar-icon").cloneNode(true); // 根据 https://github.com/lclichen/LiteLoaderQQNT-TTS/issues/4 修改
    // 将id-func-bar-expression替换为id-func-bar-tts_on
    barIcon.querySelector("#id-func-bar-expression").id = "tts-bar-icon";
    // 将svg替换为上面的svg
    barIcon.querySelector("svg").outerHTML = icon;
    // 将aria-label的值替换为发送TTS消息，似乎不会生效，以后再改
    barIcon.querySelector("#tts-bar-icon").setAttribute("aria-label", "发送TTS消息");
    // 添加一个快速选择配置的下拉小箭头
    const arrowIcon = document.createElement('div');
    arrowIcon.className = "arrow";
    const arrowIconChild = document.createElement('i');
    arrowIconChild.className = "q-svg-icon q-icon lite-tools-vue-component vue-component";
    arrowIconChild.id = "tts-bar-icon-arrow";
    arrowIconChild.setAttribute("bf-toolbar-item","")
    arrowIconChild.setAttribute("role","button")
    arrowIconChild.setAttribute("tabindex","-1")
    arrowIconChild.setAttribute("bf-label-inner","true")
    arrowIconChild.setAttribute("aria-label","TTS配置选择");
    arrowIconChild.style = "width: 16px; height: 16px; --234e3e61: inherit;";

    arrowIconChild.innerHTML = '<svg viewBox="0 0 16 16"><use xlink:href="/_upper_/resource/icons/setting_24.svg#setting_24"></use></svg>';

    arrowIcon.appendChild(arrowIconChild);
    
    // 将barIcon添加到iconBarLeft的最后
    iconBarLeft.appendChild(barIcon);

    // 给barIcon->child->ttsSenderIcon添加点击事件
    const ttsSenderIcon = barIcon.querySelector("#tts-bar-icon");
    ttsSenderIcon.addEventListener("click", async () => {
        if (document.querySelector("#tts-notice") != undefined) {
            return;
        }
        const currentContact = Contact.getCurrentContact();
        const content = document.querySelector('.ck-editor__editable');
        const sourceText = content.innerText;
        const noticeElement = document.createElement('div');
        noticeElement.className = "q-tooltips__content q-tooltips__bottom";
        noticeElement.style = "bottom: -31px; transform: translateX(-50%); left: 50%;";
        const noticeElementChild = document.createElement('div');
        noticeElementChild.id = "tts-notice";
        noticeElementChild.className = "primary-content";
        noticeElementChild.textContent = "转换中...";
        noticeElement.appendChild(noticeElementChild);
        barIcon.firstChild.appendChild(noticeElement);
        if (mainOption == null) {
            mainOption = await LiteLoader.api.config.get("text_to_speech");
        }
        if (currentOption == null) {
            currentOption = await text_to_speech.getSubOptions(mainOption.currentOption);
        }
        // 调用TTS接口
        let buffer = null;
        try {
            buffer = await callTTS(sourceText, "中文", currentOption);
        } catch (error) {
            logger.error("[转换出错][TTS接口调用不成功]", error);
        }

        // 将buffer通过ffmpeg转换为pcm格式
        let result = null;
        try {
            result = await text_to_speech.saveFile(`tts@${Date.now()}.${currentOption.params.format}`, buffer);
        } catch (error) {
            logger.error("[转换出错][格式转换不成功，请检查ffmpeg配置]", error);
        }
        logger.info(result);

        if (result.res == "success") {
            const silkData = await text_to_speech.getSilk(result.file);
            logger.info(silkData);

            if (mainOption.enableTTSPreview) {
                // 增加预览功能
                noticeElementChild.textContent = "转换完成.";
                const audioChild = document.createElement('audio');
                audioChild.id="audioPlayer";
                audioChild.setAttribute('controls', true)
                audioChild.src = result.origin;
                noticeElement.appendChild(audioChild);
                const sendButton = document.createElement('button');
                sendButton.id = "tts-send-button";
                sendButton.className = "q-button q-button--small q-button--primary";
                sendButton.textContent = "发送";
                sendButton.style = "float: right;";

                const regenButton = document.createElement('button');
                regenButton.id = "tts-regen-button";
                regenButton.className = "q-button q-button--small q-button--primary";
                regenButton.textContent = "重新生成";

                const cancelButton = document.createElement('button');
                cancelButton.id = "tts-cancel-button";
                cancelButton.className = "q-button q-button--small q-button--secondary";
                cancelButton.textContent = "取消";

                const ttsButtonBar = document.createElement('div');
                ttsButtonBar.className = "tts-button-bar";
                ttsButtonBar.appendChild(regenButton);
                ttsButtonBar.appendChild(cancelButton);
                ttsButtonBar.appendChild(sendButton);
                
                noticeElement.appendChild(ttsButtonBar);
                noticeElement.addEventListener("click", (e) => {
                    e.stopPropagation();
                });

                noticeElement.querySelector('#tts-send-button').addEventListener("click", async (e) => {
                    currentContact.sendMessage(new Audio(silkData.path, silkData.duration/1024));
                    barIcon.firstChild.removeChild(noticeElement);
                    e.stopPropagation();
                });
                noticeElement.querySelector('#tts-regen-button').addEventListener("click", async (e) => {
                    barIcon.firstChild.removeChild(noticeElement);
                    e.stopPropagation();
                    ttsSenderIcon.click();
                });
                noticeElement.querySelector('#tts-cancel-button').addEventListener("click", async (e) => {
                    barIcon.firstChild.removeChild(noticeElement);
                    e.stopPropagation();
                });
            }
            else {
                currentContact.sendMessage(new Audio(silkData.path, silkData.duration/1024));
                barIcon.firstChild.removeChild(noticeElement);
            }
        } else {
            logger.warn(result.msg);
            barIcon.firstChild.removeChild(noticeElement);
        }
    });

    // 需要额外添加一个配置列表的选择项
    barIcon.firstChild.appendChild(arrowIcon)
    arrowIcon.addEventListener("click", async () => {
        if (barIcon.firstChild.querySelector("#tts-option-quick-selector") != undefined) {
            barIcon.firstChild.removeChild(barIcon.firstChild.querySelector("#tts-option-quick-selector"));
            return;
        }
        // 显示可选配置列表
        if (mainOption == null) {
            mainOption = await LiteLoader.api.config.get("text_to_speech");
        }
        if (optionsList == null) {
            optionsList = mainOption.availableOptions;
        }
        if (currentOption == null) {
            currentOption = await text_to_speech.getSubOptions(mainOption.currentOption);
        }
        const optionQSelector = document.createElement('select');
        optionQSelector.id = "tts-option-quick-selector";
        optionQSelector.innerHTML = optionsList.map((optionName) => {
            return `<option value="${optionName}" ${optionName === mainOption.currentOption ? "selected" : ""}>${optionName}</option>`;
        }).join("");
        barIcon.firstChild.appendChild(optionQSelector);
        optionQSelector.addEventListener("change", async (e) => {
            mainOption.currentOption = e.target.value;
            await LiteLoader.api.config.set("text_to_speech", mainOption);
            currentOption = await text_to_speech.getSubOptions(mainOption.currentOption);
            barIcon.firstChild.removeChild(optionQSelector);
        });
    })
});

document.addEventListener('drop', e => {
    if (document.querySelector(".audio-msg-input") != undefined) {
        e.dataTransfer.files.forEach(async file => {
            const currentContact = Contact.getCurrentContact();
            const result = await text_to_speech.convertAndSaveFile(file.path);
            // 这一步应该增加格式转换功能
            logger.info(result);
            if (result.res == "success") {
                const silkData = await text_to_speech.getSilk(result.file);
                logger.info(silkData);
                currentContact.sendMessage(new Audio(silkData.path, silkData.duration/1024));
            } else {
                logger.warn(result.msg);
            }
        });
    }
});

// 打开设置界面时触发
export const onSettingWindowCreated = async view => {
    const html_file_path = `local:///${pluginPath}/src/settings.html`;
    const htmlText = await (await fetch(html_file_path)).text()
    view.insertAdjacentHTML('afterbegin', htmlText)

    // 添加插件图标 (".nav-item.liteloader") -> (".nav-bar.liteloader > .nav-item")
    document.querySelectorAll(".nav-bar.liteloader > .nav-item").forEach((node) => {
        // 本插件图标
        if (node.textContent === "文本转语音") {
            node.querySelector(".q-icon").innerHTML = `<svg fill="currentColor" stroke-width="1.5" viewBox="0 0 1092 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M1010.551467 424.925867c0 86.016-65.365333 155.886933-147.0464 166.638933H819.882667c-81.681067-10.752-147.0464-80.622933-147.0464-166.638933H580.266667c0 123.630933 92.603733 231.1168 212.411733 252.6208V785.066667h87.176533v-107.52C999.662933 656.042667 1092.266667 553.915733 1092.266667 424.96h-81.7152z m-76.253867-231.150934C934.2976 140.014933 890.743467 102.4 841.728 102.4a91.204267 91.204267 0 0 0-92.603733 91.374933v91.374934h190.634666V193.774933h-5.461333z m-190.634667 231.150934c0 53.76 43.588267 91.374933 92.603734 91.374933a91.204267 91.204267 0 0 0 92.603733-91.374933V333.550933h-185.207467v91.374934zM464.213333 150.698667L324.266667 10.24l-6.826667-6.826667L314.026667 0l-3.413334 3.413333-6.826666 6.8608-20.48 20.548267-3.413334 3.413333 3.413334 6.8608 13.653333 13.687467 75.093333 75.3664H218.453333c-122.88 6.826667-218.453333 109.568-218.453333 229.444267v10.274133h51.2v-10.24c0-92.501333 75.093333-171.281067 167.253333-178.107733h153.6L296.96 256.853333l-10.24 10.274134-3.413333 6.826666-3.413334 3.447467 3.413334 3.413333 27.306666 27.409067 3.413334 3.413333 3.413333-3.413333 30.72-30.8224 116.053333-116.4288 3.413334-3.413333-3.413334-6.8608zM58.026667 534.254933v130.1504h64.853333v-65.058133h129.706667v359.594667H187.733333V1024h194.56v-65.058133H317.44V599.3472h129.706667v65.058133H512v-130.1504H58.026667z"></path></svg>`;
        }
    });

    // 获取配置列表

    if (mainOption == null) {
        mainOption = await LiteLoader.api.config.get("text_to_speech");
    }
    if (optionsList == null) {
        optionsList = mainOption.availableOptions;
    }
    if (currentOption == null) {
        currentOption = await text_to_speech.getSubOptions(mainOption.currentOption);
    }
    
    const apiOpenOptions = view.querySelector(".text_to_speech .open");
    const apiReloadOptions = view.querySelector(".text_to_speech .reload");
    const enableTTSPreview = view.querySelector(".text_to_speech .enableTTSPreview");


    apiOpenOptions.addEventListener("click", async () => {
        await text_to_speech.openFileManager(LiteLoader.plugins["text_to_speech"].path.data);
    });

    apiReloadOptions.addEventListener("click", async () => {
        mainOption = await LiteLoader.api.config.get("text_to_speech");
        optionsList = mainOption.availableOptions;
        currentOption = await text_to_speech.getSubOptions(mainOption.currentOption);
        let optionNameEditing = mainOption.currentOption;
        view.querySelector(".text_to_speech .option-select").innerHTML = optionsList.map((optionName) => {
            return `<option value="${optionName}" ${optionName === optionNameEditing ? "selected" : ""}>${optionName}</option>`;
        }).join("");
        optionsEditing = await text_to_speech.getSubOptions(optionNameEditing);
        enableTTSPreview.classList.toggle("is-active", mainOption.enableTTSPreview);
        // 渲染参数到UI
        api_input.value = optionsEditing.host;
        apiType.value = optionsEditing.host_type;
    });

    enableTTSPreview.classList.toggle("is-active", mainOption.enableTTSPreview);

    enableTTSPreview.addEventListener("click", async (event) => {
        const newValue = enableTTSPreview.classList.toggle("is-active");
        mainOption.enableTTSPreview = newValue;
        await LiteLoader.api.config.set("text_to_speech", mainOption);
    });

    // 选择当前编辑的配置文件
    const optionSelect = view.querySelector(".text_to_speech .option-select");

    // 获取配置文件中的参数
    let optionNameEditing = mainOption.currentOption;
    optionSelect.innerHTML = optionsList.map((optionName) => {
        return `<option value="${optionName}" ${optionName === optionNameEditing ? "selected" : ""}>${optionName}</option>`;
    }).join("");
    optionSelect.addEventListener("change", async (e) => {
        optionNameEditing = e.target.value;
        mainOption.currentOption = optionNameEditing;
        await LiteLoader.api.config.set("text_to_speech", mainOption);
        optionsEditing = await text_to_speech.getSubOptions(optionNameEditing);
        renderParams(view, optionsEditing);
        api_input.value = optionsEditing.host;
        apiType.value = optionsEditing.host_type;
    });

    let optionsEditing = await text_to_speech.getSubOptions(optionNameEditing);
    renderParams(view, optionsEditing);

    // TODO:获取模板列表，提供下载模板列表的功能。

    // 固定参数：host
    const api_input = view.querySelector(".text_to_speech .api-input");
    const reset = view.querySelector(".text_to_speech .reset");
    const apply = view.querySelector(".text_to_speech .apply");

    // 设置默认值
    api_input.value = optionsEditing.host;
    reset.addEventListener("click", async () => {
        api_input.value = "https://artrajz-vits-simple-api.hf.space/voice/vits";
        optionsEditing.host = api_input.value;
        // 默认存储的文件即为data目录中的config.json
        await text_to_speech.setSubOptions(optionNameEditing, optionsEditing);
        alert("已恢复默认 API");
    });

    apply.addEventListener("click", async () => {
        optionsEditing.host = api_input.value;
        await text_to_speech.setSubOptions(optionNameEditing, optionsEditing);
        alert("已应用新 API");
    });

    // 固定参数：host_type
    const apiType = view.querySelector(".text_to_speech .api-type-input");
    const apiType_apply = view.querySelector(".text_to_speech .api-type-input-apply");
    const apiType_reset = view.querySelector(".text_to_speech .api-type-input-reset");

    // 设置默认值
    apiType.value = optionsEditing.host_type;
    apiType_apply.addEventListener("click", async () => {
        optionsEditing.host_type = apiType.value;
        await text_to_speech.setSubOptions(optionNameEditing, optionsEditing);
        alert("已设置API参数类型");
    });

    apiType_reset.addEventListener("click", async () => {
        apiType.value = "vits";
        optionsEditing.host_type = "vits";
        await text_to_speech.setSubOptions(optionNameEditing, optionsEditing);
        alert("已恢复默认API参数类型");
    });

    // 动态参数：params

    // 半固定参数：params.source_key

    // 需要设定一个减号按钮，点击后删除按钮对应的参数输入框
    // 对整体参数，设定一个总的保存按钮，点击后保存所有参数

    // 新增参数按钮事件，点击后增加一个参数输入框，可以输入参数名和参数值
    // TODO: 需要修复问题，prompt不支持
    const addParamBtn = view.querySelector(".text_to_speech .add-param");
    addParamBtn.addEventListener("click", () => {
        const paramKey = prompt("请输入参数名：");
        if (paramKey && !optionsEditing.params[paramKey]) {
            optionsEditing.params[paramKey] = "";
            renderParams(view, optionsEditing); // 重新渲染
        } else {
            alert("参数名已存在或无效！");
        }
    });

    // 总的保存按钮事件
    const saveAllBtn = view.querySelector(".text_to_speech .save-all");
    saveAllBtn.addEventListener("click", async () => {
        // 保存所有参数
        await text_to_speech.setSubOptions(optionNameEditing, optionsEditing);
        alert("所有参数已保存！");
    });



    // view 为 Element 对象，修改将同步到插件设置界面
}
