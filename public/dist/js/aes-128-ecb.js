/**
 * "AES/cbc/pkcs5Padding" encription and decription.
 * setAutoPadding(true) is actually pkcs5Padding,.
 */
'use strict';

var crypto = require('crypto');

var CBC = 'cbc';
var ECB = 'ecb';
var NULL_IV = new Buffer([]);

var IV = new Buffer([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
var cipherMode = ECB;
var keySize = 128;
var algorithm;
setAlgorithm();
var outputEncoding = 'base64';
var inputEncoding = 'utf8';

function setAlgorithm() {
    algorithm = 'aes-' + keySize + '-' + cipherMode;
}

function setCipherMode(mode) {
    if (mode !== CBC && mode !== ECB) {
        throw ('AES.setCipherMode error: ' + mode);
    }
    cipherMode = mode;
    setAlgorithm();
}

function setKeySize(size) {
    if (size !== 128 && size !== 256) {
        throw ('AES.setKeySize error: ' + size);
    }
    keySize = size;
    setAlgorithm();
    // console.log('setKeySize:%j',keySize);
}

/**
 * the key must match the keySize/8 , like:16 ,32
 * @param  {Buffer} key
 * @return {}
 */
function checkKey(key) {
    if (!key) {
        throw 'AES.checkKey error: key is null ';
    }
    if (key.length !== (keySize / 8)) {
        throw 'AES.checkKey error: key length is not ' + (keySize / 8) + ': ' + key.length;
    }
}

/**
 * buffer/bytes encription
 * @param  {Buffer} buff
 * @param  {Buffer} key  the length must be 16 or 32
 * @param  {Buffer} [newIv]   default is [0,0...0]
 * @return {encripted Buffer}
 */
function encBytes(buff, key, newIv) {
    checkKey(key);
    var iv = newIv || IV;
    if (cipherMode === ECB) iv = NULL_IV;
    var cipher = crypto.createCipheriv(algorithm, key, iv);
    cipher.setAutoPadding(true);
    var re = Buffer.concat([cipher.update(buff), cipher.final()]);
    // console.log('enc re:%s,len:%d', printBuf(re), re.length);
    return re;
}

/**
 * text encription
 * @param  {string} text
 * @param  {Buffer} key         the length must be 16 or 32
 * @param  {Buffer} [newIv]       default is [0,0...0]
 * @param  {string} [input_encoding]  ["utf8" -default,"ascii","base64","binary"...](https://nodejs.org/api/buffer.html#buffer_buffer)
 * @param  {string} [output_encoding] ["base64" -default,"hex"]
 * @return {string}                 encription result
 */
function encText(text, key, newIv, input_encoding, output_encoding) {
    checkKey(key);
    var iv = newIv || IV;
    if (cipherMode === ECB) iv = NULL_IV;
    var inEncoding = input_encoding || inputEncoding;
    var outEncoding = output_encoding || outputEncoding;
    var buff = new Buffer(text, inEncoding);
    var out = encBytes(buff, key, iv);
    var re = new Buffer(out).toString(outEncoding);
    return re;
}

/**
 * buffer/bytes decription
 * @param  {Buffer} buff
 * @param  {Buffer} key  the length must be 16 or 32
 * @param  {Buffer} [newIv] default is [0,0...0]
 * @return {encripted Buffer}
 */
function decBytes(buff, key, newIv) {
    checkKey(key);
    var iv = newIv || IV;
    if (cipherMode === ECB) iv = NULL_IV;
    var decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAutoPadding(true);
    var out = Buffer.concat([decipher.update(buff), decipher.final()]);
    return out;
}

/**
 * text decription
 * @param  {string} text
 * @param  {Buffer} key         the length must be 16 or 32
 * @param  {Buffer} [newIv]       default is [0,0...0]
 * @param  {string} [input_encoding]  ["utf8" - default,"ascii","base64","binary"...](https://nodejs.org/api/buffer.html#buffer_buffer)
 * @param  {string} [output_encoding] ["base64"- default ,"hex"]
 * @return {string}                 decription result
 */
function decText(text, key, newIv, input_encoding, output_encoding) {
    checkKey(key);
    var iv = newIv || IV;
    if (cipherMode === ECB) iv = NULL_IV;
    var inEncoding = input_encoding || inputEncoding;
    var outEncoding = output_encoding || outputEncoding;
    var buff = new Buffer(text, outEncoding);
    var re = new Buffer(decBytes(buff, key, iv)).toString(inEncoding);
    return re;
}


exports.setCipherMode = setCipherMode;
exports.setKeySize = setKeySize;
exports.encText = encText;
exports.encBytes = encBytes;
exports.decText = decText;
exports.decBytes = decBytes;

// 以下为测试部分
// //key是16进制，需要转换为buffer，转换后buffer长度为16，即aes128，如果buffer长度是32则是aes256
// var key = new Buffer("c4b84456c1379bec99c4d1b7e9f13173", 'hex');
// var key256 = new Buffer("c4b84456c1379bec99c4d1b7e9f13173c4b84456c1379bec99c4d1b7e9f13173", 'hex');
// var str = "helloworld 你好";
// var buffer = new Buffer(str,"utf8");
//
// //aes-ecb-128 buffer
// var buffer_encrypt = encBytes(buffer,key);
// var crypto_buffer =decBytes(buffer_encrypt,key);
// var str = crypto_buffer.toString();
// console.log(str);
//
// //aes-ecb-128 string
// var text_encrypt = encText(str,key);
// var text_decrypt =decText(text_encrypt,key);
// console.log(text_decrypt);
//
// text_encrypt = encText(str,key,null,'utf8','base64');
// text_decrypt =decText(text_encrypt,key,null,'utf8','base64');
// console.log(text_decrypt);
//
// //aes-cbc-128 buffer
// setCipherMode(CBC);
// var iv = new Buffer("abcdefgh12345678","utf8");//字符串一定是16位
// buffer_encrypt = encBytes(buffer,key,iv);
// crypto_buffer =decBytes(buffer_encrypt,key,iv);
// str = crypto_buffer.toString();
// console.log(str);
//
// //aes-cbc-128 string
// text_encrypt = encText(str,key,iv);
// text_decrypt =decText(text_encrypt,key,iv);
// console.log(text_decrypt);
//
// text_encrypt = encText(str,key,iv,'utf8','base64');
// text_decrypt =decText(text_encrypt,key,iv,'utf8','base64');
// console.log(text_decrypt);
//
//
// //aes-ecb-256 buffer
// setKeySize(256);
// setCipherMode(ECB);
// buffer_encrypt = encBytes(buffer,key256);
// crypto_buffer =decBytes(buffer_encrypt,key256);
// str = crypto_buffer.toString();
// console.log("256=="+str);
