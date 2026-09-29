<?php
defined('BASEPATH') OR exit('No direct script access allowed');

/*
 * Razorpay API Keys Configuration
 * ─────────────────────────────────────────────────────────────────────────────
 * Get your keys from: https://dashboard.razorpay.com/app/keys
 *
 * TEST  keys start with: rzp_test_
 * LIVE  keys start with: rzp_live_
 *
 * Replace the placeholder values below with your real Razorpay keys.
 * Never commit live secret keys to version control.
 * ─────────────────────────────────────────────────────────────────────────────
 */
$config['razorpay_key_id']     = getenv('RAZORPAY_KEY_ID')     ?: 'rzp_test_YOUR_KEY_ID_HERE';
$config['razorpay_key_secret'] = getenv('RAZORPAY_KEY_SECRET') ?: 'YOUR_KEY_SECRET_HERE';
