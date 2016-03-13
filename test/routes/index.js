'use strict';

let env = process.env.NODE_ENV || 'development';
let _ = require('lodash');
let express = require('express');
let router = express.Router();
let jdpay = require('../../lib');

let PARAM_CONFIG = {
	'pay_check': ['out_trade_no', 'trade_subject', 'trade_amount', 'request_datetime', 'buyer_info', 'sub_order_info'],
	'refund_check': ['out_trade_no', 'request_datetime', 'original_out_trade_no', 'trade_amount'],
	'customs_check': ['out_trade_no', 'request_datetime', 'sub_out_trade_no', 'sub_order_no', 'custom', 'cbe_code', 'cbe_name', 'cbe_code_insp', 'ecp_code', 'ecp_name', 'ecp_code_insp']
};

/**
 * 支付接口
 * query{
 *   token://用户交易令牌，选填
 *   out_trade_no:'' //交易流水号, 商户网站订单系统中唯一订单号，必填
 *   ,trade_subject:'' //订单摘要 必填
 *   ,trade_amount:'' //交易金额,必填
 *   ,request_datetime:''//格式yyyymmddTHH24MMSS 必填
 *   ,buyer_info:''//买方信息（用户信息） json 必填
 *   ---买方信息---
 *  customer_code:''//用户编码，用户在商户平台的唯一标识 必填
 *   -------------
 *   ,sub_order_info:''//子订单信息，可以有多个子订单，数据结构为：[{子订单1},{子订单2},{子订单3}] json 必填
 *   ---子订单---
 *   sub_order_no:''//子订单号 必填
 *   ,sub_order_name:''//子订单描述 必填
 *   ,sub_order_amount:''//子订单金额，单位：分 必填
 *   -----------
 *   ,settle_currency:''//结算币种，默认为USD 选填 选填
 *   ,return_params:''//订单返回信息，返回、通知或查询时会原样返回 选填
 *  }
 */
router.get('/jdpay_import_pay', function(req, res, next) {
	let e = req.query;
	console.info('jdpay_import_pay params:', e);
	let args = _.pick(e, PARAM_CONFIG.pay_check);
	e.buyer_info = JSON.parse(e.buyer_info);
	e.sub_order_info = JSON.parse(e.sub_order_info);
	if (_.keys(args).length === PARAM_CONFIG.pay_check.length) {
		try {
			return jdpay.jdpay_import_pay(e, res);
		} catch (error) {
			console.error('jdpay_import_pay error:', error);
			return res.status(500).json({
				'message': '服务端错误'
			});
		}
	} else {
		return res.status(400).json({
			'message': '参数错误'
		})
	}

});

/**
 * 支付 手机版
 */
router.get('/jdpay_import_pay_app', function(req, res, next) {
	let e = req.query;
	console.info('jdpay_import_pay_app params:', e);
	let args = _.pick(e, PARAM_CONFIG.pay_check);
	if (_.keys(args).length === PARAM_CONFIG.pay_check.length) {
		try {
			return jdpay.jdpay_import_pay_app(e, res);
		} catch (error) {
			console.error('jdpay_import_pay_app error:', error);
			return res.status(500).json({
				'message': '服务端错误'
			});
		}
	} else {
		return res.status(400).json({
			'message': '参数错误'
		})
	}

});


/**
 * 退款
 * query{
 *  out_trade_no:'',//商户退款流水号
 *  request_datetime:'',//yyyymmddTHH24MMSS
 *  original_out_trade_no: '', //原商户订单流水号
 *  trade_amount:'', //交易金额
 *  trade_subject :'',// 退款原因 选填
 *   return_params :''//退款回传参数 选填
 * }
 */
router.get('/jdpay_import_refund', function(req, res, next) {
	let e = req.query;
	console.info('jdpay_import_refund params:', e);
	let args = _.pick(e, PARAM_CONFIG.refund_check);
	if (_.keys(args).length === PARAM_CONFIG.refund_check.length) {
		try {
			return jdpay.jdpay_import_refund(e, res).then(function(info) {
				return res.status(200).json(info);
			}, function(error) {
				console.error('jdpay_import_refund error:', error);
				return res.status(500).json({
					'message': '服务端错误',
					'error': error
				});
			});
		} catch (error) {
			console.error('jdpay_import_refund error:', error);
			return res.status(500).json({
				'message': '服务端错误'
			});
		}
	} else {
		return res.status(400).json({
			'message': '参数错误'
		})
	}
});

/**
 * 报关接口
 * query{
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
router.get('/jdpay_acquire_customs', function(req, res, next) {
	let e = req.query;
	console.info('jdpay_acquire_customs params:', e);
	let args = _.pick(e, PARAM_CONFIG.customs_check);
	if (_.keys(args).length === PARAM_CONFIG.customs_check.length) {
		try {
			return jdpay.jdpay_acquire_customs(e).then(function(info) {
				return res.status(200).json(info);
			}, function(error) {
				console.error('jdpay_acquire_customs error:', error);
				return res.status(500).json({
					'message': '服务端错误',
					'error': error
				});
			});
		} catch (e) {
			console.error('jdpay_acquire_customs error:', e);
			return res.status(500).json({
				'message': '服务端错误'
			});
		}
	} else {
		return res.status(400).json({
			'message': '参数错误'
		})
	}
});

module.exports = router;