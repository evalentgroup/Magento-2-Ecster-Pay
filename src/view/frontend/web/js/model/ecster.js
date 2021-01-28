/**
 * Copyright © Evalent Group AB, Inc. All rights reserved.
 * See COPYING.txt for license details.
 */
define(
    [
        'jquery',
        'ko',
        'Evalent_EcsterPay/js/model/quote',
        'Evalent_EcsterPay/js/model/config',
        'mage/url',
        'Magento_Ui/js/model/messageList',
        'mage/translate',
        'Magento_Checkout/js/model/full-screen-loader',
        'Magento_Customer/js/customer-data',
        'ecsterpayjs'
    ],
    function (
        $,
        ko,
        quote,
        ecsterConfig,
        urlBuilder,
        messageList,
        $t,
        fullScreenLoader,
    ) {

        'use strict';

        var isUpdateCountry, checkoutUpdating = false;
        var updateShippingOnSuccess = null;

        return {
            key: quote.getEcsterCartKey(),
            isUpdating: ko.observable(false),

            ecsterStart: function () {
                EcsterPay.start({
                    cartKey: this.key,
                    shopTermsUrl: ecsterConfig.shopTermsUrl,
                    showCart: ecsterConfig.showCart,
                    showPaymentResult: false,
                    showDelivery: ecsterConfig.showDelivery,
                    onCheckoutStartInit: $.proxy(function () {
                        this.onCheckoutStartInit();
                    }, this),
                    onCheckoutStartSuccess: $.proxy(function () {
                        this.onCheckoutStartSuccess();
                    }, this),
                    onCheckoutStartFailure: $.proxy(function (response) {
                        this.onCheckoutStartFailure(response);
                    }, this),
                    initUpdateCart: $.proxy(function () {
                        this.onCheckoutInitUpdateCart();
                    }, this),
                    finishUpdateCart: $.proxy(function () {
                        this.onCheckoutFinishUpdateCart();
                    }, this),
                    onCheckoutUpdateInit: $.proxy(function () {
                        console.trace()
                        this.onCheckoutUpdateInit();
                    }, this),
                    onCheckoutUpdateSuccess: $.proxy(function () {
                        this.onCheckoutUpdateSuccess();
                    }, this),
                    onCustomerAuthenticated: $.proxy(function (response) {
                        this.onCustomerAuthenticated(response);
                    }, this),
                    onChangedDeliveryAddress: $.proxy(function (response) {
                        this.onChangedDeliveryAddress(response);
                    }, this),
                    onPaymentSuccess: $.proxy(function (response) {
                        this.onPaymentSuccess(response);
                    }, this),
                    onPaymentFailure: $.proxy(function (response) {
                        this.onPaymentFailure(response);
                    }, this),
                    onPaymentDenied: $.proxy(function (response) {
                        this.onPaymentDenied(response);
                    }, this),
                });
            },
            onCheckoutStartInit: function (response) {
                fullScreenLoader.startLoader();
                this.isUpdating(true)
                 console.log("onCheckoutStartInit");
            },
            onCheckoutStartSuccess: function (response) {
                this.isUpdating(false)
                fullScreenLoader.stopLoader();
                console.log("onCheckoutStartSuccess");
            },
            onCheckoutStartFailure: function (response) {
                this.isUpdating(false)
                fullScreenLoader.stopLoader();
                 console.log(response);
                 console.log("onCheckoutStartFailure");
            },
            onCheckoutUpdateInit: function (response) {
                this.isUpdating(true)
                fullScreenLoader.startLoader();
                 console.log("onCheckoutUpdateInit");
            },
            onCheckoutInitUpdateCart: function (response) {
                this.isUpdating(false)
                fullScreenLoader.startLoader();
                 console.log("onCheckoutInitUpdateCart");
            },
            onCheckoutFinishUpdateCart: function (response) {
                this.isUpdating(false)
                fullScreenLoader.stopLoader();
                 console.log("onCheckoutFinishUpdateCart");
            },
            onCheckoutUpdateSuccess: function (response) {
                fullScreenLoader.stopLoader();
                this.isUpdating(false)
                console.log("onCheckoutUpdateSuccess");
            },
            onCustomerAuthenticated: function (response) {
                 console.log("onCustomerAuthenticated");
            },
            onChangedContactInfo: function (response) {
                 console.log('onChangedContactInfo');
            },
            onChangedDeliveryAddress: function (response) {
                this.reserveOrderId();
                console.log('onChangedDeliveryAddress');
            },
            onPaymentSuccess: function (response) {
                fullScreenLoader.startLoader();
                window.location.href = ecsterConfig.successUrl + 'ecster-reference/' + response.internalReference;
            },
            onPaymentFailure: function (response) {
                 console.log('onPaymentFailure');
            },
            onPaymentDenied: function (response) {
                 console.log("onPaymentDenied");
            },
            onBeforeSubmit: function (data) {
            },
            initEcsterDiv: function () {
                $('#ecster-pay-ctr').html('');
            },
            isCheckoutUpdating: function () {
                return this.isUpdating()
            },
            updateShippingMethodOnSuccess: function () {

            },
            isUpdateCountry: function () {
                return isUpdateCountry;
            },
            setUpdateCountry: function () {
                isUpdateCountry = true;
            },
            init: function () {
                this.ecsterStart();
            },
            updateInitCart: function (currentCartKey) {
                return EcsterPay.initUpdateCart(currentCartKey);
            },
            updateCheckoutType: function (type) {
                let success = true;
                console.log("updateCheckoutType")
                if (type != ecsterConfig.preselectedPurchaseType) { // Make sure that not useless calls being made
                    $.ajax({ // Update the cart with the correct purchase type before updating the checkout
                        url: urlBuilder.build('ecsterpay/checkout/updatecart'),
                        type: 'get',
                        async: false,
                        dataType: 'json',
                        context: this,
                        data: {
                            'type': type
                        },

                        /**
                         * @param {Object} response
                         */
                        success: function (response) {
                            if (response.error) {
                                messageList.addErrorMessage({ message: response.message });
                                success = false;
                                return;
                            }
                            this.key = response.ecster_key
                            ecsterConfig.preselectedPurchaseType = type;
                            this.initEcsterDiv()
                            this.ecsterStart()
                            success = true;
                        },
                        error: function (reponse) {
                            messageList.addErrorMessage({ message: $t('Something went wrong. Try again and if the problem persists please contact the support for more information') });
                            success = false;
                        }
                    });
                }
                return success;
            },
            updateCart: function () {
                let success = true;
                var updateCartCallBack = this.updateInitCart(quote.getEcsterCartKey());
                $.ajax({
                    url: urlBuilder.build('ecsterpay/checkout/updatecart'),
                    type: 'get',
                    async: false,
                    dataType: 'json',
                    context: this,

                    /**
                     * @param {Object} response
                     */
                    success: function (response) {
                        if (response.error) {
                            messageList.addErrorMessage({ message: response.message });
                            success = false;
                            return;
                        }
                        this.key = response.ecster_key
                        quote.setEcsterCartKey(response.ecster_key);
                        updateCartCallBack(response.ecster_key)
                        success = true;
                    },
                    error: function (reponse) {
                        messageList.addErrorMessage({ message: $t('Something went wrong. Try again and if the problem persists please contact the support for more information') });
                        success = false;
                    }
                });
                return success;
            },
            reserveOrderId: function () {
                let success = true;
                var updateCartCallBack = this.updateInitCart(quote.getEcsterCartKey());
                $.ajax({
                    url: urlBuilder.build('ecsterpay/checkout/reserveorderid'),
                    type: 'get',
                    async: false,
                    dataType: 'json',
                    context: this,

                    /**
                     * @param {Object} response
                     */
                    success: function (response) {
                        if (response.error) {
                            messageList.addErrorMessage({ message: response.message });
                            success = false;
                            return;
                        }
                        this.key = response.ecster_key
                        quote.setEcsterCartKey(response.ecster_key);
                        updateCartCallBack(response.ecster_key)
                        success = true;
                    },
                    error: function (reponse) {
                        success = false;
                    }
                });
                return success;
            }
        };
    }
);
