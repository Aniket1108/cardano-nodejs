const express = require('express')
const router = express.Router()

const cardano = require('../api/cardano.js')

router.post('/queryUTXO', cardano.queryUTXO)
router.post('/getUTXOlist', cardano.getUTXOlist)
router.get('/queryProtocolParameters', cardano.queryProtocolParameters)
router.get('/queryTip', cardano.queryTip)
router.post('/createWallet', cardano.createWallet)
router.post('/buildAddress', cardano.buildAddress)
router.post('/transactionCalculateMinFee', cardano.transactionCalculateMinFee)
router.post('/submittx', cardano.submittx)
router.post('/getBalance', cardano.getBalance)

module.exports = router