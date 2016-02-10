'use strict';

let express = require('express');
let router = express.Router();


/*data{
    token://用户交易令牌，选填
 out_trade_no:'' //交易流水号, 商户网站订单系统中唯一订单号，必填
 ,trade_subject:'' //订单摘要 必填
 ,trade_amount:'' //交易金额,必填
 ,request_datetime:''//格式yyyymmddTHH24MMSS 必填
 ,buyer_info:''//买方信息（用户信息） json 必填
 ,customer_code:''//用户编码，用户在商户平台的唯一标识 必填
 ,sub_order_info:''//子订单信息，可以有多个子订单，数据结构为：[{子订单1},{子订单2},{子订单3}] json 必填
 ,sub_order_no:''//子订单号 必填
 ,sub_order_name:''//子订单描述 必填
 ,sub_order_amount:''//子订单金额，单位：分 必填
 ,settle_currency:''//结算币种，默认为USD 选填 选填
 ,return_params:''//订单返回信息，返回、通知或查询时会原样返回 选填
 }*/
router.get('/', function(req, res, next) {
	res.json('asdasd')
});

module.exports = router;