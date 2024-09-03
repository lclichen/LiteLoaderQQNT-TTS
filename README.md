<h1 align="center">LiteLoaderQQNT-TTS</h1>

---

LiteLoaderQQNT 文本转语音

基于TTS接口(vits、GPT-SoVITS等)，将输入字符转为语音发送。

## 安装 | Installation

需为LiteLoaderQQNT安装 [Euphony](https://github.com/xtaw/LiteLoaderQQNT-Euphony) 依赖。

### 手动安装(从 Releases 中下载稳定版)

- 下载 [最新发布版本](https://github.com/lclichen/LiteLoaderQQNT-TTS/releases/latest) 中的 `text_to_speech.zip`
- 将压缩包中的内容解压到[数据目录](https://github.com/mo-jinran/LiteLoaderQQNT-Plugin-Template/wiki/1.%E4%BA%86%E8%A7%A3%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84#liteloader%E7%9A%84%E6%95%B0%E6%8D%AE%E7%9B%AE%E5%BD%95)下的 `plugins/text_to_speech` 文件夹中
- 重启 `QQ` 完成安装

完成后的目录结构应该如下:

```
plugins (所有的插件目录)
└── text_to_speech (此插件目录)
    ├── manifest.json (插件元数据)
    └── ... (其他文件)
```

### 使用 `LiteLoaderQQNT-PluginInstaller` 插件安装

- 根据 [README](https://github.com/xinyihl/LiteLoaderQQNT-PluginInstaller/blob/main/README.md) 安装 [LiteLoaderQQNT-PluginInstaller](https://github.com/xinyihl/LiteLoaderQQNT-PluginInstaller) 插件，然后选择以下方案之一

#### 1. 通过 `URL Schemes` 跳转 `QQ` 安装插件

- 根据 [README](https://github.com/PRO-2684/protocio/blob/main/README.md) 安装 [Protocio](https://github.com/PRO-2684/protocio) 插件，对 `URL Schemes` 进行解析
- 点击[链接](llqqnt://plugininstaller/lclichen/LiteLoaderQQNT-TTS/main/manifest.json)，完成安装
- 或者在[PluginInstaller的插件列表](https://xinyihl.github.io/LiteLoaderQQNT-PluginInstaller/)中寻找需要的插件完成安装

#### 2. 在 `PluginInstaller` 插件内安装

- 打开 `QQ` 的设置页面，切换至 `PluginInstaller` 标签页
- 输入下方链接，完成安装

```
https://github.com/lclichen/LiteLoaderQQNT-TTS/blob/main/manifest.json
```

## 使用 | Usage

1. TTS功能：打开一个对话界面，在编辑框中键入所希望进行转换的文本，点击编辑框上方的TTS按钮。
2. TTS发送前预览：在设置中启用TTS预览，生成后将出现一个预览界面（由于前端解码的限制，如果后端返回的音频格式在`wav`、`ogg`、`mp3`以外，可能无法被播放。
3. 音频发送功能：（Copy From Audio-Sender）点击编辑框上方的语音图标，切换到发送语音界面，直接将音频文件拖入聊天窗口即可。

## 注意事项 | Notes

建议用户自行填写TTS接口地址，目前支持类似于[simple-vits-api](https://github.com/Artrajz/vits-simple-api)类型的，在请求中发送文本，直接获取音频文件的响应。

例如，gptsovits的接口格式根据[GPT-SoVITS/api.py](https://github.com/RVC-Boss/GPT-SoVITS/blob/main/api.py)中的推理格式构建，请按照该文件中的使用方式启用GPT-SoVITS后端API接口（接口更新请自行同步，目前GPT-SoVITS并没有稳定的接口）。

如果向后端请求的音频格式在`silk`以外，则需要配置ffmpeg，用于格式转换。
**注意，即使后端不解析format参数，也需要保留配置文件中的format参数用于模块解析后端返回的音频格式**

## 依赖

1. 需安装[Euphony](https://github.com/xtaw/LiteLoaderQQNT-Euphony)插件，用于消息发送。
2. 将 [ffmpeg (包括 ffprobe)](https://ffmpeg.org) 添加至环境变量，用于将非silk格式音频转换到pcm格式，便于后续编码。

## 参考

1. 整体结构参考了[DeepL插件](https://github.com/MUKAPP/LiteLoaderQQNT-DeepL/)。
2. 格式转换参考了[Audio-Sender插件](https://github.com/xtaw/LiteLoaderQQNT-Audio-Sender/)。

## ChangeLog

1. 配置文件结构更新
2. 增加音频发送前预览功能

## TODO

1. 支持调用Windows系统语音
2. Mac上的ffmpeg相关问题解决
3. 更人性化的设置界面
4. 开放TTS接口，允许其他插件调用

### 自建TTS后端注意事项 | Notes for TTS Server

如果向后端请求的音频格式设置为`silk`的话：

1. python环境下如果使用graiax-silkcoder的话建议安装[本人修改并重新编译的版本](https://github.com/lclichen/graiax-silkcoder/releases/tag/0.3.7)，以支持[QQNT的silk格式](https://github.com/kn007/silk-v3-decoder/pull/85)，并适应音频格式判断方式。
2. 其他环境请保证接口支持QQNT版本的silk格式输出，否则建议采用其他格式。

## 交流反馈

点击链接加入群聊【TTS问题反馈与接口交流 857365160】：[https://qm.qq.com/q/jMGb3zgiHu](https://qm.qq.com/q/jMGb3zgiHu)