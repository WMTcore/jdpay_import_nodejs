'use strict';

let env = process.env.NODE_ENV || 'development';
let config={
	customer_no:''
	,customer_no_APP:''
	,MD5_Key:''
	,MD5_Key_APP:''
}
var Jdpay = require('./jdpay').Jdpay;

var jdpay = new Jdpay(config);
 jdpay.on('verify_fail',function(){console.log('index emit verify_fail')})
    .on('jdpay_import_trade_success', function(out_trade_no, trade_no){ console.log('test: jdpay_import_trade_success ')})
    .on('jdpay_import_trade_fail', function(out_trade_no, trade_no){console.log('test: jdpay_import_trade_fail')})
    // .on('refund_fastpay_by_platform_pwd_success', function(batch_no, success_num, result_details){console.log('test： callback: refund_fastpay_by_platform_pwd_success')})

module.exports = jdpay;