'use strict';

var JdpayNotify = require('./jdpay_notify.class').JdpayNotify;
var JdpaySubmit = require('./jdpay_submit.class').JdpaySubmit;
var assert = require('assert');
var url = require('url');
var inherits = require('util').inherits,
    EventEmitter = require('events').EventEmitter;
var https = require('https');
var xml2js = require('xml2js');
var _ = require('lodash');

var default_jdpay_config = {
    customer_no: '', //商户号
    customer_no_APP: '',
    MD5_Key: '',
    MD5_Key_APP: '',
    host: '',
    jdpay_import_pay_return_url: '/jdpay/jdpay_import_pay/return_url',
    jdpay_import_notify_url: '/jdpay/jdpay_import/notify_url',
    jdpay_pay_url: 'https://cbe.wangyin.com/cashier/payment', //支付
    jdpay_refund_url: 'https://cbe.wangyin.com/cashier/refund', //退款
    jdpay_query_url: 'https://cbe.wangyin.com/cashier/queryOrder', //查询
    jdpay_pay_app_url: 'https://cbe.wangyin.com/cashier/mobile/payment', //手机支付
    jdpay_acquire_customs_url: 'http://211.152.0.104/customs/pushCustoms', //报关
    jdpay_query_customs_url: 'http://211.152.0.104/customs/queryPushStatus' //报关查询
};

function Jdpay(jdpay_config) {
    EventEmitter.call(this);

    //default config
    this.jdpay_config = default_jdpay_config;
    //config merge
    _.merge(this.jdpay_config, jdpay_config);
}

/**
 * @ignore
 */
inherits(Jdpay, EventEmitter);

Jdpay.prototype.route = function(app) {
    var self = this;
    app.post(this.jdpay_config.jdpay_import_pay_return_url, function(req, res) {
        self.jdpay_import_return(req, res)
    });
    app.post(this.jdpay_config.jdpay_import_notify_url, function(req, res) {
        self.jdpay_import_notify(req, res)
    });
}

//京东支付进口版支付接口
/*data{
    token://用户交易令牌，选填
 out_trade_no:'' //交易流水号, 商户网站订单系统中唯一订单号，必填
 ,trade_subject:'' //订单摘要 必填
 ,trade_amount:'' //交易金额,必填
 ,request_datetime:''//格式yyyymmddTHH24MMSS 必填
 ,buyer_info:''//买方信息（用户信息） json 必填
 ---买方信息---
customer_code:''//用户编码，用户在商户平台的唯一标识 必填
customer_type：'OUT_CUSTOMER_VALUE'//用户类型，填OUT_CUSTOMER_VALUE
 ---买方信息---
 ,sub_order_info:''//子订单信息，可以有多个子订单，数据结构为：[{子订单1},{子订单2},{子订单3}] json 必填
 ---子订单---
 sub_order_no:''//子订单号 必填
 ,sub_order_name:''//子订单描述 必填
 ,sub_order_amount:''//子订单金额，单位：分 必填
 ---子订单---
 ,settle_currency:''//结算币种，默认为USD 选填 必填
 ,return_params:''//订单返回信息，返回、通知或查询时会原样返回 选填
 }*/
Jdpay.prototype.jdpay_import_pay = function(data, res) {
    //建立请求
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config);

    var parameter = {
        buyer_info: {
            customer_type: 'OUT_CUSTOMER_VALUE'
        },
        customer_no: this.jdpay_config.customer_no,
        trade_currency: 'CNY' //货币类型,固定填 CNY
            ,
        notify_url: this.jdpay_config.host + this.jdpay_config.jdpay_import_notify_url //服务器异步通知页面路径,必填，不能修改, 需http://格式的完整路径，
            ,
        return_url: this.jdpay_config.host + this.jdpay_config.jdpay_import_pay_return_url //页面跳转同步通知页面路径 需http://格式的完整路径，不能写成http://localhost/      
    };
    _.merge(parameter, data);
    parameter.buyer_info = JSON.stringify(parameter.buyer_info);
    parameter.sub_order_info = JSON.stringify(parameter.sub_order_info);

    var htmlText = jdpaySubmit.buildRequestForm(parameter, this.jdpay_config.jdpay_pay_url);
    res.send(htmlText);
}


//京东支付进口版支付接口 app
/*data{
    token://用户交易令牌，选填
 out_trade_no:'' //交易流水号, 商户网站订单系统中唯一订单号，必填
 ,trade_subject:'' //订单摘要 必填
 ,trade_amount:'' //交易金额,必填
 ,request_datetime:''//格式yyyymmddTHH24MMSS 必填
 ,buyer_info:''//买方信息（用户信息） json 必填
  ---买方信息---
customer_code:''//用户编码，用户在商户平台的唯一标识 必填
customer_type：'OUT_CUSTOMER_VALUE'//用户类型，填OUT_CUSTOMER_VALUE
 ---买方信息---
 ,sub_order_info:''//子订单信息，可以有多个子订单，数据结构为：[{子订单1},{子订单2},{子订单3}] json 必填
 ---子订单---
 sub_order_no:''//子订单号 必填
 ,sub_order_name:''//子订单描述 必填
 ,sub_order_amount:''//子订单金额，单位：分 必填
 ---子订单---
 ,settle_currency:''//结算币种，默认为USD 选填 必填
 ,return_params:''//订单返回信息，返回、通知或查询时会原样返回 选填
 }
 * md5_key与网页版的相同，若不同，记得修改this.jdpay_config
 */
Jdpay.prototype.jdpay_import_pay_app = function(data, res) {
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config);

    var parameter = {
        customer_type: 'OUT_CUSTOMER_VALUE',
        customer_no: this.jdpay_config.customer_no_APP,
        trade_currency: 'CNY' //货币类型,固定填 CNY
            ,
        notifyUrl: this.jdpay_config.host + this.jdpay_config.jdpay_import_notify_url //服务器异步通知页面路径,必填，不能修改, 需http://格式的完整路径，
            ,
        return_url: this.jdpay_config.host + this.jdpay_config.jdpay_import_pay_return_url //页面跳转同步通知页面路径 需http://格式的完整路径，不能写成http://localhost/      
    };
    _.merge(parameter, data);
    parameter.buyer_info = JSON.stringify(parameter.buyer_info);
    parameter.sub_order_info = JSON.stringify(parameter.sub_order_info);

    var htmlText = jdpaySubmit.buildRequestForm(parameter, this.jdpay_config.jdpay_pay_app_url);
    res.send(htmlText);
}


/**
 * 退款接口 
 * data{
 *  out_trade_no:'',//商户退款流水号
 *  request_datetime:'',//yyyymmddTHH24MMSS
 *  original_out_trade_no: '', //原商户订单流水号
 *  trade_amount:'', //交易金额
 *  trade_subject :'',// 退款原因 选填
 *   return_params :''//退款回传参数 选填
 *
 } 
 */
Jdpay.prototype.jdpay_import_refund = function(data, res) {
    //建立请求
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config),
        jdpayNotify = new JdpayNotify(this.jdpay_config);

    var infoList = ['out_trade_no', 'trade_no', 'trade_amount', 'trade_status'];

    //构造要请求的参数数组，无需改动
    var parameter = {
        customer_no: this.jdpay_config.customer_no,
        trade_currency: 'CNY'
    };
    _.merge(parameter, data)

    var postData = jdpaySubmit.buildRequestPara(parameter),
        parsed_url = require('url').parse(this.jdpay_config.jdpay_refund_url);

    //post
    return jdpayNotify.getHttpResponsePOST(this.jdpay_config.jdpay_refund_url, postData, infoList);
};

/**
 *  支付、退款结果异步通知
 */
Jdpay.prototype.jdpay_import_notify = function(req, res) {
    var self = this;

    var infoList = ['out_trade_no', 'refund_amount', 'confirm_amount', 'return_params', 'buyer_info', 'customer_code', 'trade_no']
    var _POST = req.body;
        //计算得出通知验证结果
    var jdpayNotify = new JdpayNotify(this.jdpay_config);
    //验证消息是否是京东发出的合法消息
    jdpayNotify.verifyNotify(_POST, function(verify_result) {
        if (verify_result) { //验证成功
            var info = _.pick(_POST, infoList);
            if (_POST.trade_class == 'SALE' && _POST.trade_status == 'FINI') {
                    //trade_class 交易类别，用于区分支付和退款结果通知 SALE:消费/支付,REFD退款
                self.emit('jdpay_import_trade_success_SALE', info);
            } else if (_POST.trade_class == 'REFD' && _POST.trade_status == 'REFU') {
                self.emit('jdpay_import_trade_success_REFD', info)
            }
            res.send("success"); //请不要修改或删除
        } else {
            //验证失败
            self.emit("verify_fail");
            res.send("fail");
        }
    });

}

//支付成功页面跳转
Jdpay.prototype.jdpay_import_return = function(req, res) {
    var self = this;

    var infoList = ['out_trade_no', 'refund_amount', 'confirm_amount', 'return_params', 'buyer_info', 'customer_code', 'trade_no']
    var _POST = req.body;
    //计算得出通知验证结果
    var jdpayNotify = new JdpayNotify(this.jdpay_config);
    //验证消息是否是京东发出的合法消息
    jdpayNotify.verifyNotify(_POST, function(verify_result) {
        if (verify_result) { //验证成功
            var info = _.pick(_POST, infoList);
            res.send("success");
        } else {
            //验证失败
            self.emit("verify_fail");
            res.send("fail");
        }
    });
}

/**
 * 查询接口 
 * data{
 *  out_trade_no:'',//商户订单流水号，支付或退款时商户所传的值
 *  request_datetime:'',//yyyymmddTHH24MMSS
 *  trade_no:'', //网银内部的交易流水号
 *
 *} 
 */
Jdpay.prototype.jdpay_import_query_order = function(data, res) {
    //建立请求
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config),
        jdpayNotify = new JdpayNotify(this.jdpay_config);

    var infoList = ['out_trade_no', 'refund_amount', 'confirm_amount', 'return_params', 'buyer_info', 'customer_code', 'trade_no']

    //构造要请求的参数数组，无需改动
    var parameter = {
        customer_no: this.jdpay_config.customer_no,
        sign_type: 'MD5',
    };
    _.merge(parameter, data)

    var postData = jdpaySubmit.buildRequestPara(parameter),
        parsed_url = require('url').parse(this.jdpay_config.jdpay_query_url);

    return jdpayNotify.getHttpResponsePOST(parsed_url, postData, infoList);
};

/**
 * 报关接口 
 * data{
 *  out_trade_no:'',//商户订单流水号，支付或退款时商户所传的值
 *  request_datetime:'',//yyyymmddTHH24MMSS
 *  sub_out_trade_no:'', //子单流水号,商户生成，主要用于子单海关报送，建议规则是商户订单流水号+子单流水号后3位
 *  sub_order_no:'',//报关的子单编号
 *  custom:''//海关名称全拼
 *  cbe_code：''//电商企业海关编号
 *  cbe_name:'' //电商企业海关名称
 *  cbe_code_insp:''//电商企业国检编号
 *  ecp_code:''//电商平台海关编号
 *  ecp_name:''//电商平台海关名称
 *  ecp_code_insp:''//电商平台国检编号
 *  } 
 */
Jdpay.prototype.jdpay_acquire_customs = function(data, res) {
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config),
        jdpayNotify = new JdpayNotify(this.jdpay_config);

    // 需要的数据
    var infoList = ['out_trade_no', 'sub_out_trade_no', 'sub_order_no']

    //构造要请求的参数数组，无需改动
    var parameter = {
        customer_no: this.jdpay_config.customer_no,
        sign_type: 'MD5',
    };
    _.merge(parameter, data)

    //数据签名
    var postData = jdpaySubmit.buildRequestPara(parameter),
        parsed_url = require('url').parse(this.jdpay_config.jdpay_acquire_customs_url);

    //post
    return jdpayNotify.getHttpResponsePOST(parsed_url, postData, infoList);
};

/**
 * 报关接口 查询 
 * data{
 *  out_trade_no:'',//商户订单流水号，支付或退款时商户所传的值
 *  request_datetime:'',//yyyymmddTHH24MMSS
 *  sub_out_trade_no:'', // 选填 子单流水号,商户生成，主要用于子单海关报送，建议规则是商户订单流水号+子单流水号后3位 
 *  sub_order_no:'',//报关的子单编号
 * } 
 */
Jdpay.prototype.jdpay_query_customs = function(data, res) {
    var jdpaySubmit = new JdpaySubmit(this.jdpay_config),
        jdpayNotify = new JdpayNotify(this.jdpay_config);

    // 需要的数据
    var infoList = ['out_trade_no', 'sub_out_trade_no', 'sub_order_no', 'custom_push_status', 'custom_push_status_desc', 'insp_push_status', 'insp_push_status_desc']

    //构造要请求的参数数组，无需改动
    var parameter = {
        customer_no: this.jdpay_config.customer_no,
        sign_type: 'MD5',
    };
    _.merge(parameter, data)

    //数据签名
    var postData = jdpaySubmit.buildRequestPara(parameter),
        parsed_url = require('url').parse(this.jdpay_config.jdpay_query_customs_url);

    //post
    return jdpayNotify.getHttpResponsePOST(parsed_url, postData, infoList);

};

exports.Jdpay = Jdpay;