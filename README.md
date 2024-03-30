# LiteLoaderQQNT-TTS

LiteLoaderQQNT 文本转语音插件

需要用户自行填写TTS接口地址，目前仅支持类似于[simple-vits-api](https://github.com/Artrajz/vits-simple-api)类型的，在请求中发送文本直接获取音频文件响应流的转换。

gptsovits的接口格式临时根据[GPT-SoVITS/api.py](https://github.com/RVC-Boss/GPT-SoVITS/blob/main/api.py)中的推理格式构建，请按照该文件中的使用方式启用GPT-SoVits后端API接口。

如果向后端请求的音频格式在silk、wav、单声道 pcm_s16le 文件以外，则需要配置ffmpeg等用于格式转换。
**注意，即使后端不解析format参数，也需要保留format参数用于模块解析后端返回的音频格式**

接口参数的变更目前需要直接修改配置文件中的参数。

QQNT的设置中暂时只支持更换接口地址。

## 使用方法

1. 在编辑框中键入所希望进行转换的文本，点击编辑框上方的TTS按钮
2. （Copy From Voice Sender）点击编辑框上方的语音图标，切换到发送语音界面，直接将音频文件拖入聊天窗口即可

## 注意事项

### TTS后端注意事项

如果向后端请求的音频格式设置为silk文件的话：

1. python环境下如果使用graiax-silkcoder的话建议安装[本人修改并重新编译的版本](https://github.com/lclichen/graiax-silkcoder/releases/tag/0.3.7)，以支持[QQNT的silk格式](https://github.com/kn007/silk-v3-decoder/pull/85)，并适应LLAPI。
2. 其他环境请保证接口支持QQNT版本的silk格式输出，否则建议采用其他格式。

## 依赖

1. LLAPI>=1.4.0
2. 将 [ffmpeg (包括 ffprobe)](https://ffmpeg.org) 添加至环境变量

## 参考

1. 整体结构参考了[DeepL插件](https://github.com/MUKAPP/LiteLoaderQQNT-DeepL/)。

2. 格式转换参考了[Audio-Sender插件]。

****

LiteLoaderQQNT本体：[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT)

## ChangeLog

1. 修复明暗模式的问题
2. 修改gpt-sovits的默认配置
3. 配置文件将储存到数据目录中，避免被更新覆盖
4. 在设置中增加说明
5. 增加了[TTS for GPT-soVITS](https://www.yuque.com/xter/zibxlp)的默认配置 `ttsforgptsovits`，暂未加入更新中，如有需求可自行编辑。

## TODO

1. 支持调用Windows系统语音
2. 更合理的配置文件
3. 在QQ设置中进行动态的配置设置
