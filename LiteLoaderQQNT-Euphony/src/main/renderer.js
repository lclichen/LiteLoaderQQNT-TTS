import { Contact, Friend, Group, SingleMessage, MessageChain, MessageSource, PlainText, Image, Audio, At, AtAll, Raw, EventChannel, Client, Cache } from '../index.js';

Object.defineProperty(window, 'euphony', {
    value: {
        Contact,
        Friend,
        Group,
        SingleMessage,
        MessageChain,
        MessageSource,
        PlainText,
        Image,
        Audio,
        At,
        AtAll,
        Raw,
        EventChannel,
        Client,
        Cache
    },
    writable: false
});