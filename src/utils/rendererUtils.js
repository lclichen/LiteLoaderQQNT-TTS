/**
 * `Cache` 类是一个工具类，它用于缓存一些对象数据。
 * 
 * 当一个函数返回的数据很少发生改变时，应使用此工具类，将结果缓存，以减少开销。
 * 
 * @property { Map } #caches 缓存数据。
 */
export class Cache {

    static #caches = new Map();

    /**
     * 将 `defaultSupplier` 返回的数据以 `key` 为键缓存，并返回数据。
     * 
     * @param { any } key 缓存的键。
     * @param { Function } defaultSupplier 返回默认数据的函数。
     * @returns { any } 缓存数据。
     */
    static withCache(key, defaultSupplier) {
        let value = Cache.#caches.get(key);
        if (!value) {
            value = defaultSupplier();
            Cache.#caches.set(key, value);
        }
        return value;
    }

    /**
     * 将 `defaultSupplier` 返回的数据以 `key` 为键缓存，并返回数据。
     * 
     * @param { any } key 缓存的键。
     * @param { Function } defaultSupplier 返回默认数据的异步函数。
     * @returns { any } 缓存数据。
     */
    static async withCacheAsync(key, defaultSupplier) {
        let value = Cache.#caches.get(key);
        if (!value) {
            value = await defaultSupplier();
            Cache.#caches.set(key, value);
        }
        return value;
    }

}

let cachedCurAioDataPath = null;

/**
 * 根据字符串路径安全地从对象中获取嵌套值。
 * @param {object} rootObject - 开始查找的根对象，例如 window 或 app。
 * @param {string} path - 要访问的路径，例如 'user.profile.name' 或 'user.friends[0]'。
 * @returns {any|undefined} 返回找到的值，如果路径无效则返回 undefined。
 */
function getValueByPath(rootObject, path) {
    if (!path || typeof path !== 'string') {
        return undefined;
    }
    // 将路径 'a.b[0].c' 转换为 ['a', 'b', '0', 'c']
    const keys = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '').split('.');

    let result = rootObject;
    for (const key of keys) {
        if (result === null || typeof result !== 'object') {
            return undefined;
        }
        result = result[key];
    }
    return result;
}
export function patchCss() {
    console.log(pluginName + 'css加载中')

    let style = document.createElement('style')
    style.type = "text/css";
    style.id = "echo-message-css";

    let sHtml = `
.em-msg-container {
    position: relative;
    overflow: unset !important;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: row;
}

.em-plus-one-img-right {
    position: absolute;
    left: calc(100% - 5px);
    width: 25px;
    height: 25px;
    border-radius: 50%;
    opacity: 0.2;
    color: var(--text-color);
    background-color: var(--background-color-05);
    backdrop-filter: blur(14px);
    box-shadow: var(--box-shadow);
    transition: 250ms;
}


.em-plus-one-img-left {
    position: absolute;
    right: calc(100% - 5px);
    width: 25px;
    height: 25px;
    border-radius: 50%;
    opacity: 0.2;
    color: var(--text-color);
    background-color: var(--background-color-05);
    backdrop-filter: blur(28px);
    box-shadow: var(--box-shadow);
    transition: 250ms;
}

`

    style.innerHTML = sHtml
    document.getElementsByTagName('head')[0].appendChild(style)
    console.log(pluginName + 'css加载完成')
}

const textElement = {
    elementType: 1, elementId: '', textElement: {
        content: '', atType: 0, atUid: '', atTinyId: '', atNtUid: ''
    }
}

const success = [{
    "senderFrame": {}, "frameId": 1, "processId": 6, "frameTreeNodeId": 3
}, false, "RM_IPCFROM_RENDERER3", [{
    "type": "request", "callbackId": "16102db9-dca5-45fd-8b28-3cead14512a6", "eventName": "ntApi", "peerId": 3
}, {
    "cmdName": "nodeIKernelMsgService/forwardMsgWithComment", "cmdType": "invoke", "payload": [{
        "msgIds": ["7596720489687103620"],
        "srcContact": { "chatType": 2, "peerUid": "934773893", "guildId": "" },
        "dstContacts": [{ "chatType": 2, "peerUid": "934773893", "guildId": "" }],
        "commentElements": [],
        "msgAttributeInfos": {}
    }, null]
}]]

/**
 * [V4 优化版] - 查找对象中某个 key 的最短可访问路径及其对应的值
 *
 * 该算法使用广度优先搜索 (BFS) 来保证找到的路径层级最浅。
 * 它会忽略 Vue 内部的响应式依赖属性（如 dep, __v_raw, _value 等），
 * 从而避免产生超长的无效路径。
 *
 * @param {object} rootObject - 搜索的起始对象，例如 `app` 或 `window`。
 * @param {string} targetKey - 要查找的属性名，例如 "curAioData"。
 * @returns {{path: string, value: any}|null} - 返回一个包含最短路径和对应值的对象，如果找不到则返回 null。
 */
function findShortestPathAndValue(rootObject, targetKey) {
    console.log(`🚀 开始搜索 "${targetKey}" 的最短路径和值...`);

    // 定义需要忽略的属性名
    const ignoreProps = new Set([
        'dep', '__v_raw', '__v_skip', '_value', '__ob__',
        'prevDep', 'nextDep', 'prevSub', 'nextSub', 'deps', 'subs',
        '__vueParentComponent', 'parent', 'provides'
    ]);

    // 使用广度优先搜索 (BFS)
    const queue = [{ obj: rootObject, path: 'app' }]; // 队列中存储对象及其路径
    const visited = new Set(); // 存储已经访问过的对象，防止循环引用

    visited.add(rootObject);

    while (queue.length > 0) {
        const { obj, path } = queue.shift(); // 取出队列头的元素

        // 检查当前对象是否直接包含目标 key
        if (obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, targetKey)) {
            const finalPath = `${path}.${targetKey}`;
            const finalValue = obj[targetKey]; // 【新】获取找到的值

            console.log(`✅ 成功! 找到最短路径:`);
            console.log(`%c${finalPath}`, 'color: #4CAF50; font-weight: bold; font-size: 14px;');
            console.log('✅ 对应的值为:', finalValue);


            // 验证路径是否真的可访问
            try {
                if (eval(finalPath) === finalValue) {
                    console.log("路径验证成功！");
                    // 【修改点】返回一个包含路径和值的对象
                    return { path: finalPath, value: finalValue };
                }
            } catch (e) {
                console.warn(`找到路径 "${finalPath}"，但无法通过 eval 访问。继续搜索...`);
            }
        }

        // 将子属性加入队列
        for (const prop in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
                if (ignoreProps.has(prop)) {
                    continue;
                }

                const childObj = obj[prop];

                if (childObj && typeof childObj === 'object' && !visited.has(childObj)) {
                    visited.add(childObj);
                    const newPath = Array.isArray(obj) ? `${path}[${prop}]` : `${path}.${prop}`;
                    queue.push({ obj: childObj, path: newPath });
                }
            }
        }
    }

    console.log(`❌ 搜索完成，未找到 "${targetKey}" 的可访问路径。`);
    return null;
}


// --- 如何使用 ---

// 假设 app 依然是你的 Vue 应用根对象
// const shortestPath = findShortestPath(app, 'curAioData');

// if (shortestPath) {
//     console.log("你可以通过以下方式访问数据:");
//     console.log(`const data = ${shortestPath}`);
// }

/**
 * `Contact` 类型代表所有的联系人。
 * 
 * @property { String } #id 该联系人的标识，在 `Friend` 中表示好友的 **qq号**，在 `Group` 中表示群聊的 **群号**。
 */
export class Contact {

    #id;

    /**
     * 返回当前窗口上正在进行的聊天对象。如果没有聊天对象，或聊天对象类型不受支持，则返回 `null`。
     * 
     * @returns { Contact } 当前窗口上正在进行的聊天对象。
     */
    static getCurrentContact() {
        let curAioData;
        console.log("--- 开始获取 curAioData ---");
        // 1. [优先] 尝试使用缓存的路径
        if (cachedCurAioDataPath) {
            curAioData = getValueByPath(window, cachedCurAioDataPath); // 假设根对象是 window
            if (curAioData) {
                console.log(`✅ 成功从缓存路径获取: ${cachedCurAioDataPath}`);
            } else {
                console.warn(`⚠️ 缓存路径 "${cachedCurAioDataPath}" 已失效。`);
            }
        }

        // 2. [回退] 如果缓存路径失效或不存在，尝试已知的固定路径
        if (!curAioData) {
            console.log("... 尝试已知路径 1 (老版本)");
            curAioData = app?.__vue_app__?.config?.globalProperties?.$store?.state?.common_Aio?.curAioData;
        }
        if (!curAioData) {
            console.log("... 尝试已知路径 2 (新版本)");
            curAioData = app?.__vue_app__?.config?.globalProperties?.$dt?.pageManager?.pageMap?.pg_aio_pc?.pageRoot?.__VUE__?.[0]?.proxy?.aioStore?.curAioData;
        }

        // 3. [最后手段] 如果所有已知路径都失败，则执行搜索
        if (!curAioData) {
            console.log("... 所有已知路径均失败，开始执行全局搜索...");
            const result = findShortestPathAndValue(app, "curAioData");
            if (result && result.value) {
                curAioData = result.value;
                // 找到后，立即更新缓存！
                cachedCurAioDataPath = result.path;
                console.log(`✅ 搜索成功！已缓存新路径: ${cachedCurAioDataPath}`);
            }
        }

        // 4. 最终检查
        if (!curAioData) {
            console.error("❌ 致命错误: 所有方法都未能获取到 curAioData。无法执行复读操作。");
            return; // 中断执行
        }

        console.log("--- 获取成功, 准备转发消息 ---", curAioData);

        const uin = curAioData?.header?.uin;
        const uid = curAioData?.header?.uid;
        console.log(`[TTSS]`, uid)
        console.log(`[TTSS]`, uin)

        if (!uin || !uid) {
            return null;
        }
        switch (curAioData.chatType) {
            case Friend.getChatType():
                return Friend.make(uin, uid);
            case Group.getChatType():
                return Group.make(uin);
        }
    }

    /**
     * （抽象函数，由子类实现）
     * 
     * 返回该联系人类型所对应的 **chatType**。
     * 
     * @returns { Number } 该联系人类型所对应的 **chatType**。
     */
    static getChatType() {
        throw new Error('Abstract method not implemented.');
    }

    /**
     * 仅供子类调用。
     * 
     * @param { String } id 在 `Friend` 中表示好友的 **qq号**，在 `Group` 中表示群聊的 **群号**。
     */
    constructor(id) {
        this.#id = id;
    }

    /**
     * 向该联系人发送一条消息，并返回其在服务器上的来源。
     * 
     * @param { MessageChain | SingleMessage } message 消息内容。
     * @param { String } msgId 消息的 **msgId**，如果此参数为空则会随机生成。
     * @returns { MessageSource } 发送的信息在服务器上的来源。
     */
    async sendMessage(message, msgId = undefined) {
        if (!msgId) {
            msgId = `7${Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('')}`;
        }
        console.log(`[Text_to_speech]msgID: `, msgId)
        // console.log(`[Text_to_speech]message is Single?: `, message instanceof SingleMessage)
        await window.text_to_speech.invokeNative('ntApi', 'nodeIKernelMsgService/sendMsg', false, {
            msgId,
            peer: this.toPeer(),
            msgElements: message instanceof SingleMessage ? [await message.toElement()] : await message.toElements(),
            msgAttributeInfos: new Map()
        });
        return new MessageSource(msgId, this);
    }

    async sendPttMessage(silkData, msgId = undefined) {
        const path = silkData.path
        const duration = silkData.duration/1024
        const fileMd5 = silkData.fileMd5
        if (!msgId) {
            msgId = `7${Array.from({ length: 18 }, () => Math.floor(Math.random() * 10)).join('')}`;
        }
        // console.log(`[Text_to_speech]msgID: `, msgId)
        // 构造Ptt消息元素
        // const { fileMd5, fileSize } = await text_to_speech.getPttFileInfo(path)
        // console.log(`[Text_to_speech] Audio fileMd5: `, fileMd5)
        // console.log(`[Text_to_speech] Audio fileSize: `, fileSize)
        // const { fileSizeApi } = await text_to_speech.invokeNative('FileApi', 'getFileSize', window.webContentId, [path])
        const fileSize = await text_to_speech.nativeCall(
            {
                type: "request",
                eventName: "FileApi",
            },
            {
                cmdName: "getFileSize",
                cmdType: "invoke",
                payload: [path],
            },
            true,
        );
        console.log(`[Text_to_speech] Audio fileSize: `, fileSize)
        const cachePath = await text_to_speech.nativeCall(
            {
                type: "request",
                eventName: "ntApi",

            },
            {
                cmdName: "nodeIKernelMsgService/getRichMediaFilePathForGuild",
                cmdType: "invoke",
                payload: [{
                    path_info: {
                        md5HexStr: fileMd5,
                        fileName: fileMd5 + '.amr',
                        elementType: 4,
                        elementSubType: 0,
                        thumbSize: 0,
                        needCreate: true,
                        downloadType: 1,
                        file_uuid: ''
                    }
                }]
            },
            true,
        );
        await text_to_speech.copyFileToCache(path, cachePath)
        console.log(`[Text_to_speech] Audio cachePath: `, cachePath)

        //调用消息发送函数
        await text_to_speech.nativeCall(
            {
                type: "request",
                eventName: "ntApi",

            },
            {
                cmdName: "nodeIKernelMsgService/sendMsg",
                cmdType: "invoke",
                payload: [{
                    msgId,
                    peer: this.toPeer(),
                    msgElements: [
                        {
                            elementId: '',
                            elementType: 4,
                            pttElement: {
                                fileName: fileMd5 + '.amr',
                                filePath: cachePath,
                                md5HexStr: fileMd5,
                                fileSize: fileSize,
                                duration: duration ?? Math.max(1, Math.round(fileSize / 1024 / 3)),
                                formatType: 1,
                                voiceType: 1,
                                voiceChangeType: 0,
                                canConvert2Text: true,
                                waveAmplitudes: [
                                    0, 18, 9, 23, 16, 17, 16, 15, 44, 17, 24, 20, 14, 15, 17
                                ],
                                fileSubId: '',
                                playState: 1,
                                autoConvertText: 0
                            }
                        }
                    ],
                    msgAttributeInfos: new Map()
                }]
            },
            null,
        );
    }

    /**
     * 返回该联系人的 `#id` 属性。
     * 
     * @returns { String } 该联系人的 `#id` 属性。
     */
    getId() {
        return this.#id;
    }

    /**
     * （抽象函数，由子类实现）
     * 
     * 构造并返回该联系人所对应的 **peer** 对象。
     * 
     * @returns { Native } 该联系人所对应的 **peer** 对象。
     */
    toPeer() {
        throw new Error('Abstract method not implemented.');
    }

}



/**
 * `Friend` 类型代表好友。
 * 
 * @property { String } #uid 好友的 **uid**。
 */
class Friend extends Contact {

    #uid;

    /**
     * 返回该联系人类型所对应的 **chatType**，值为 **1**。
     * 
     * @returns { Number } 该联系人类型所对应的 **chatType**，值为 **1**。
     */
    static getChatType() {
        return 1;
    }

    /**
     * 构造一个 **qq号** 为 `uin`，**uid** 为 `uid` 的好友。
     * 
     * 该函数构造出的好友全局只有一个实例，相同的 `uin` 和 `uid` 将会返回相同的对象。
     * 
     * 在任何情况下，都应该使用该函数来构造好友，而非直接使用构造器。
     * 
     * @param { String } uin 好友的 **qq号**。
     * @param { String } uid 好友的 **uid**。
     * @returns { Friend } 构造出的好友。
     */
    static make(uin, uid) {
        return Cache.withCache(`friend-${uin}-${uid}`, () => new Friend(uin, uid));
    }

    /**
     * 构造一个 **qq号** 为 `uin`，**uid** 为 `uid` 的好友。
     * 
     * 注意：在任何情况下，都不应该直接使用该构造器来构造好友。相反地，你应该使用 `Friend.make(uin, uid)` 函数来构造好友。
     * 
     * @param { String } uin 好友的 **qq号**。
     * @param { String } uid 好友的 **uid**。
     */
    constructor(uin, uid) {
        super(uin);
        this.#uid = uid;
    }

    /**
     * 构造并返回该好友所对应的 **peer** 对象。
     * 
     * @returns { Native } 该好友所对应的 **peer** 对象。
     */
    toPeer() {
        return {
            chatType: Friend.getChatType(),
            peerUid: this.#uid,
            guildId: ''
        };
    }
}



/**
 * `Group` 类型代表群聊。
 */
class Group extends Contact {

    /**
     * 返回该联系人类型所对应的 **chatType**，值为 **2**。
     * 
     * @returns { Number } 该联系人类型所对应的 **chatType**，值为 **2**。
     */
    static getChatType() {
        return 2;
    }

    /**
     * 构造一个 **群号** 为 `id` 的群聊。
     * 
     * 该函数构造出的群聊全局只有一个实例，相同的 `id` 将会返回相同的对象。
     * 
     * 在任何情况下，都应该使用该函数来构造群聊，而非直接使用构造器。
     * 
     * @param { String } id 群聊的 **群号**。
     * @returns { Group } 构造出的群聊。
     */
    static make(id) {
        return Cache.withCache(`group-${id}`, () => new Group(id));
    }

    /**
     * 构造一个 **群号** 为 `id` 的群聊。
     * 
     * 注意：在任何情况下，都不应该直接使用该构造器来构造群聊。相反地，你应该使用 `Group.make(id)` 函数来构造群聊。
     * 
     * @param { String } id 群聊的 **群号**。
     */
    constructor(id) {
        super(id);
    }

    /**
     * 构造并返回该群聊所对应的 **peer** 对象。
     * 
     * @returns { Native } 该群聊所对应的 **peer** 对象。
     */
    toPeer() {
        return {
            chatType: Group.getChatType(),
            peerUid: this.getId(),
            guildId: ''
        };
    }
}
