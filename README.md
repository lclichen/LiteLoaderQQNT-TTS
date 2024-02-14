# LiteLoaderQQNT-TTS

LiteLoaderQQNT 文本转语音插件

需要用户自行填写TTS接口地址，目前仅支持类似于[simple-vits-api](https://github.com/Artrajz/vits-simple-api)类型的，文本直接到音频的转换，同时要求后端支持[QQNT的silk格式](https://github.com/kn007/silk-v3-decoder/pull/85)。

接口参数目前需要直接修改配置文件中的参数。
QQNT的设置中只支持更换接口地址。

## 依赖

LLAPI

## 参考

整体结构参考了[DeepL插件](https://github.com/MUKAPP/LiteLoaderQQNT-DeepL/)的代码，非常感谢~

LiteLoaderQQNT本体：[LiteLoaderQQNT](https://github.com/mo-jinran/LiteLoaderQQNT)
