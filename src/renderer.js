// 运行在 Electron 渲染进程 下的页面脚本
const plugin_path = LiteLoader.plugins["text_to_speech"].path.plugin;

function log(...args) {
    console.log(`[text_to_speech]`, ...args);
}

function call_tts(source_text, target, settingsCache) {
    try {
        log("转换文本：", source_text, "到(语言)：", target);
        console.log(settingsCache);
        let params = settingsCache.default_params[settingsCache.host_type];
        params[params.source_key] = source_text;
        return fetch(`${settingsCache.host}?` + new URLSearchParams(params)).then((response)=>{
            if (!response.ok){
                throw new Error(`HTTP error, status = ${response.status}`);
            }
            return response.arrayBuffer();
        })
    } catch (error) {
        log("[转换出错]", error);
    }
}

function observeElement(selector, callback, callbackEnable = true, interval = 100) {
    try {
        const timer = setInterval(function () {
            const element = document.querySelector(selector);
            if (element) {
                if (callbackEnable) {
                    callback();
                    // log("已检测到", selector);
                }
                clearInterval(timer);
            }
        }, interval);
    } catch (error) {
        log("[检测元素错误]", error);
    }
}

// 点击群助手后chat-func-bar会消失，再点群聊才会出现，所以需要再写一个监听
function observeElement2(selector, callback, callbackEnable = true, interval = 100) {
    try {
        const timer = setInterval(function () {
            const element = document.querySelector(selector);
            if (element) {
                if (callbackEnable) {
                    callback();
                    // log("已检测到", selector);
                }
            }
        }, interval);
    } catch (error) {
        log("[检测元素错误]", error);
    }
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
    // 将aria-label的值替换为发送TTS消息
    barIcon.querySelector("#tts-bar-icon").setAttribute("aria-label", "发送TTS消息");
    // 将barIcon添加到iconBarLeft的最后
    iconBarLeft.appendChild(barIcon);

    // 给barIcon添加点击事件
    barIcon.addEventListener("click", async () => {
        const peer = await LLAPI.getPeer();
        const content = document.querySelector('.ck-editor__editable');
        const sourceText = content.innerText;
        const settings = await text_to_speech.getSettings();
        const buffer = await call_tts(sourceText,"中文",settings);
        const result = await text_to_speech.saveFile(`tts.${settings.default_params[settings.host_type].format}`, buffer);
        // 这一步应该增加格式转换功能
        console.log(result);
        if (result.res == "success") {
            const elements = [
                {
                    type: "ptt",
                    file: result.file
                }
            ];
            LLAPI.sendMessage(peer, elements);
        } else {
            console.log(result.msg);
        }
    });
});

document.addEventListener('drop', e => {
    if (document.querySelector(".audio-msg-input") != undefined) {
        e.dataTransfer.files.forEach(async file => {
            const peer = await LLAPI.getPeer();
            const result = await text_to_speech.convertAndSaveFile(file.path);
            // 这一步应该增加格式转换功能
            console.log(result);
            if (result.res == "success") {
                const elements = [
                    {
                        type: "ptt",
                        file: result.file
                    }
                ];
                LLAPI.sendMessage(peer, elements);
            } else {
                console.log(result.msg);
            }
            audiosender.deleteFile(path);
        });
    }
});

// 打开设置界面时触发
export const onSettingWindowCreated = async view => {
    const html_file_path = `local:///${plugin_path}/src/settings.html`;
    const htmlText = await (await fetch(html_file_path)).text()
    view.insertAdjacentHTML('afterbegin', htmlText)

    // 添加插件图标
    document.querySelectorAll(".nav-item.liteloader").forEach((node) => {
        // 本插件图标
        if (node.textContent === "文本转语音") {
            node.querySelector(".q-icon").innerHTML = `<svg fill="currentColor" stroke-width="1.5" viewBox="0 0 1092 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M1010.551467 424.925867c0 86.016-65.365333 155.886933-147.0464 166.638933H819.882667c-81.681067-10.752-147.0464-80.622933-147.0464-166.638933H580.266667c0 123.630933 92.603733 231.1168 212.411733 252.6208V785.066667h87.176533v-107.52C999.662933 656.042667 1092.266667 553.915733 1092.266667 424.96h-81.7152z m-76.253867-231.150934C934.2976 140.014933 890.743467 102.4 841.728 102.4a91.204267 91.204267 0 0 0-92.603733 91.374933v91.374934h190.634666V193.774933h-5.461333z m-190.634667 231.150934c0 53.76 43.588267 91.374933 92.603734 91.374933a91.204267 91.204267 0 0 0 92.603733-91.374933V333.550933h-185.207467v91.374934zM464.213333 150.698667L324.266667 10.24l-6.826667-6.826667L314.026667 0l-3.413334 3.413333-6.826666 6.8608-20.48 20.548267-3.413334 3.413333 3.413334 6.8608 13.653333 13.687467 75.093333 75.3664H218.453333c-122.88 6.826667-218.453333 109.568-218.453333 229.444267v10.274133h51.2v-10.24c0-92.501333 75.093333-171.281067 167.253333-178.107733h153.6L296.96 256.853333l-10.24 10.274134-3.413333 6.826666-3.413334 3.447467 3.413334 3.413333 27.306666 27.409067 3.413334 3.413333 3.413333-3.413333 30.72-30.8224 116.053333-116.4288 3.413334-3.413333-3.413334-6.8608zM58.026667 534.254933v130.1504h64.853333v-65.058133h129.706667v359.594667H187.733333V1024h194.56v-65.058133H317.44V599.3472h129.706667v65.058133H512v-130.1504H58.026667z"></path></svg>`;
        }
    });

    // 获取设置
    
    let settings = await text_to_speech.getSettings();

    const apiOpenSettings = view.querySelector(".text_to_speech .open");
    const apiReloadSettings = view.querySelector(".text_to_speech .reload");


    apiOpenSettings.addEventListener("click", () => {
        text_to_speech.openSettings();
    });

    apiReloadSettings.addEventListener("click", async () => {
        settings = await text_to_speech.getSettings();
        api_input.value = settings.host;
        apiType.value = settings.host_type;
    });

    const api_input = view.querySelector(".text_to_speech .api-input");
    const reset = view.querySelector(".text_to_speech .reset");
    const apply = view.querySelector(".text_to_speech .apply");

    // 设置默认值
    api_input.value = settings.host;

    reset.addEventListener("click", () => {
        api_input.value = "https://artrajz-vits-simple-api.hf.space/voice/vits";
        settings.host = api_input.value;
        text_to_speech.setSettings(settings);
        // JS弹出对话框提示已恢复默认 API
        alert("已恢复默认 API");
    });

    apply.addEventListener("click", () => {
        settings.host = api_input.value;
        text_to_speech.setSettings(settings);
        // JS弹出对话框提示已应用新 API
        alert("已应用新 API");
    });

    const apiType = view.querySelector(".text_to_speech .api-type-input");
    const apiType_apply = view.querySelector(".text_to_speech .api-type-input-apply");
    const apiType_reset = view.querySelector(".text_to_speech .api-type-input-reset");

    // 设置默认值
    apiType.value = settings.host_type;

    apiType_apply.addEventListener("click", () => {
        settings.host_type = apiType.value;
        text_to_speech.setSettings(settings);
        alert("已设置API参数类型");
    });

    apiType_reset.addEventListener("click", () => {
        apiType.value = "vits";
        settings.host_type = "vits";
        text_to_speech.setSettings(settings);
        alert("已恢复默认API参数类型");
    });

    // 下面是针对各TTS配置类型的设置
    // const default_param = settings.default_params[settings.host_type]

    // 首先要根据setting来把配置变成网页中的表单
    // 其次要限定表单内容？
    // 最后要有增加参数的功能？

    // view 为 Element 对象，修改将同步到插件设置界面
}
