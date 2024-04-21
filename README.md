<h1 align="center">LiteLoaderQQNT-TTS</h1>

---

LiteLoaderQQNT 文本转语音

基于TTS接口(vits、GPT-SoVITS等)，将输入字符转为语音发送。

## 安装 | Installation

需为LiteLoaderQQNT手动安装[Euphony](https://github.com/xtaw/LiteLoaderQQNT-Euphony)插件。

### 从 Releases 中下载稳定版的方式进行安装

- 下载 [最新发布版本](https://github.com/lclichen/LiteLoaderQQNT-TTS/releases/latest) 中的 `text_to_speech.zip`
- 将压缩包中的内容解压到 [LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT) 数据目录的 `plugins/text_to_speech` 文件夹下
- 重启 QQNT 安装完成

## 使用 | Usage

1. 打开一个对话界面，在编辑框中键入所希望进行转换的文本，点击编辑框上方的TTS按钮
2. （Copy From Voice Sender）点击编辑框上方的语音图标，切换到发送语音界面，直接将音频文件拖入聊天窗口即可

## 注意事项 | Notes

建议用户自行填写TTS接口地址，目前支持类似于[simple-vits-api](https://github.com/Artrajz/vits-simple-api)类型的，在请求中发送文本直接获取音频文件的响应。

gptsovits的接口格式根据[GPT-SoVITS/api.py](https://github.com/RVC-Boss/GPT-SoVITS/blob/main/api.py)中的推理格式构建，请按照该文件中的使用方式启用GPT-SoVITS后端API接口（接口更新请自行同步，目前GPT-SoVITS并没有稳定的接口）。

如果向后端请求的音频格式在`silk`、`wav`、`单声道 pcm_s16le`文件以外，则需要配置ffmpeg，用于格式转换。
**注意，即使后端不解析format参数，也需要保留format参数用于模块解析后端返回的音频格式**

### 自建TTS后端注意事项 | Notes for TTS Server

如果向后端请求的音频格式设置为`silk`的话：

1. python环境下如果使用graiax-silkcoder的话建议安装[本人修改并重新编译的版本](https://github.com/lclichen/graiax-silkcoder/releases/tag/0.3.7)，以支持[QQNT的silk格式](https://github.com/kn007/silk-v3-decoder/pull/85)，并适应音频格式判断方式。
2. 其他环境请保证接口支持QQNT版本的silk格式输出，否则建议采用其他格式。

## 依赖

1. <del>LLAPI>=1.4.0</del> 已经删库，切换消息发送相关依赖到[Euphony](https://github.com/xtaw/LiteLoaderQQNT-Euphony)。
2. 需为LiteLoaderQQNT手动安装[Euphony](https://github.com/xtaw/LiteLoaderQQNT-Euphony)插件。
3. 将 [ffmpeg (包括 ffprobe)](https://ffmpeg.org) 添加至环境变量。

## 参考

1. 整体结构参考了[DeepL插件](https://github.com/MUKAPP/LiteLoaderQQNT-DeepL/)。
2. 格式转换参考了[Audio-Sender插件](https://github.com/xtaw/LiteLoaderQQNT-Audio-Sender/)。

## ChangeLog

1. 解决依赖问题

## TODO

1. 支持调用Windows系统语音
2. 更合理的配置文件
3. 在QQ设置中进行动态的配置设置
4. Mac上的ffmpeg相关问题解决
5. 自更新功能
