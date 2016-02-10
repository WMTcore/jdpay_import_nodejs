/* *
 * 类名：JdpayNotify
 * 功能：京东通知处理类
 * 详细：处理京东各接口通知返回
 */

var core_funcs = require('./jdpay_core.function');
var md5_f = require('./jdpay_md5.function');
var https = require('https');

function JdpayNotify(jdpay_config) {
    /**
     * HTTPS形式消息验证地址
     */
    this.https_verify_url = 'https://mapi.alipay.com/gateway.do?service=notify_verify&';
    /**
     * HTTP形式消息验证地址
     */
    this.http_verify_url = 'http://notify.alipay.com/trade/notify_query.do?';
    this.jdpay_config = jdpay_config;
}

/**
 * 针对notify_url验证消息是否是京东发出的合法消息
 * @return 验证结果
 */
JdpayNotify.prototype.verifyNotify = function(_POST, callback) {
    if (Object.keys(_POST).length == 0) { //判断POST来的数组是否为空
        callback(false);
    } else {
        //生成签名结果
        callback(this.getSignVerify(_POST, _POST.sign_data));
    }
}

/**
 * 针对return_url验证消息是否是京东发出的合法消息
 * @return 验证结果
 */
JdpayNotify.prototype.verifyReturn = function(_GET, callback) {
    if (Object.keys(_GET).length == 0) { //判断POST来的数组是否为空
        callback(false);
    } else {
        //生成签名结果
        callback(this.getSignVerifyRSA(_GET, _GET["sign"]));
    }
}

/**
 * 获取返回时的签名验证结果
 * @param para_temp 通知返回来的参数对象
 * @param sign 返回的签名结果
 * @return 签名验证结果
 */
JdpayNotify.prototype.getSignVerify = function(para_temp, sign) {
    //除去待签名参数数组中的签名参数
    var para_filter = core_funcs.paraFilter(para_temp);

    //对待签名参数数组排序
    var para_sort = core_funcs.argSort(para_filter);

    //把数组所有元素，按照“参数=参数值”的模式用“&”字符拼接成字符串
    var prestr = core_funcs.createLinkstring(para_sort);

    return md5_f.md5Verify(prestr, sign, this.jdpay_config['MD5_Key']);
}

/**
 * 远程获取数据，POST模式
 * 注意：
 * @param parsed_url 指定URL完整路径地址
 * @param postData 需要post的数据
 * @param infoList 需要获取的参数
 * return 远程输出的数据
 */
JdpayNotify.prototype.getHttpResponsePOST = function(parsed_url, postData, infoList) {
    return new Promise(function(resolve, reject) {
        var req = https.request({
            hostname: parsed_url.host,
            path: parsed_url.path,
            method: 'POST'
        }, function(res) {
            var responseText = '';
            res.on('data', function(chunk) {
                responseText += chunk;
            });
            res.on('end', function() {
                this.verifyNotify(responseText, function(verify_result) {
                    if (verify_result) { //验证成功
                        var info = _.pick(responseText, infoList);
                        if (responseText.is_success == 'Y') {
                            resolve(info);
                        } else {
                            reject(_.merge(info, {
                                response_code: responseText.response_code,
                                response_message: responseText.response_message
                            }));
                        }
                    } else {
                        reject("verify_fail");
                    }
                })
            });
        });
        req.write(postData);
        req.end();
    });
};

exports.JdpayNotify = JdpayNotify;