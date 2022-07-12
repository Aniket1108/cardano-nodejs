const fs = require('fs')
const path = require('path')
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const CardanocliJs = require("cardanocli-js");
const shelleyGenesisPath = "/root/cardano/testnet-shelley-genesis.json";

const options = {}
options.shelleyGenesisPath = shelleyGenesisPath
options.network = "testnet-magic 1097911063"

const cardanocliJs = new CardanocliJs(options);

const absolutePathPrivate = path.resolve('/root/cardanocli-js-cardano-server/keys/privatekey.pem');
const privateKey = fs.readFileSync(absolutePathPrivate, 'utf8')

exports.queryProtocolParameters = async (req, res) => {
    const protocolParameters = await cardanocliJs.queryProtocolParameters()

    res.send({
        code: 200,
        data: protocolParameters
    })
}

exports.queryTip = (req, res) => {
    const queryTip = cardanocliJs.queryTip()

    res.send({
        code: 200,
        data: queryTip
    })
}

exports.queryUTXO = (req, res) => {
    const { address } = req.body
    const UTXOs = cardanocliJs.queryUtxo(address)

    res.send({
        code: 200,
        data: UTXOs
    })
}

exports.getBalance = (req, res) => {
    const { address } = req.body
    const UTXOs = cardanocliJs.queryUtxo(address)

    let totalLovelace = 0;
    UTXOs.forEach(utxo => {
        totalLovelace += utxo.value.lovelace;
    })

    res.send({
        code: 200,
        data: {
            lovelace: totalLovelace
        }
    })
}

exports.createWallet = (req, res) => {
    const { account_name } = req.body
    let private_key = new NodeRSA(privateKey, 'pkcs8-private');
    const decrypted = private_key.decrypt(account_name, 'utf8');

    const keygen = cardanocliJs.addressKeyGen(decrypted)

    res.send({
        code: 200,
        data: "account created"
    })
}

exports.buildAddress = async (req, res) => {
    const { account_name } = req.body
    let private_key = new NodeRSA(privateKey, 'pkcs8-private');
    const decrypted = private_key.decrypt(account_name, 'utf8');

    const keygen = cardanocliJs.addressKeyGen(decrypted)

    const options = {}
    options.paymentVkey = `./priv/wallet/${decrypted}/${decrypted}.payment.vkey`

    const path = cardanocliJs.addressBuild(decrypted, options)

    fs.readFile(path, 'utf8', (err, data) => {
        res.send({
            code: 200,
            address: data
        })
    })

}

exports.getUTXOlist = (req, res) => {
    const { address, amount } = req.body
    const UTXOs = cardanocliJs.queryUtxo(address)

    const fee = 1
    var total = 0;
    var UTXOs_list = [];
    for (var i = 0; i < UTXOs.length; i++) {
        total += UTXOs[i].value.lovelace
        UTXOs_list.push({
            txHash: UTXOs[i].txHash,
            txId: UTXOs[i].txId,
            value: UTXOs[i].value
        });
        if (total >= amount + fee) {
            break;
        }
    }

    res.send({
        code: 200,
        data: UTXOs_list
    })
}

const getUTXOlist = (address, amount) => {
    const UTXOs = cardanocliJs.queryUtxo(address)

    const fee = 1
    var total = 0;
    var UTXOs_list = [];
    for (var i = 0; i < UTXOs.length; i++) {
        total += UTXOs[i].value.lovelace
        UTXOs_list.push({
            txHash: UTXOs[i].txHash,
            txId: UTXOs[i].txId,
            value: UTXOs[i].value
        });
        if (total >= amount + fee) {
            break;
        }
    }

    return UTXOs_list
}

exports.transactionCalculateMinFee = async (req, res) => {
    var { address, amount, from_address, txOutCount } = req.body
    const txIn = getUTXOlist(from_address, amount)

    var txOut = []
    const txOut1 = {
        address: address,
        value: { "lovelace": amount }
    }
    txOut.push(txOut1)
    if (txOutCount === 2) {
        const txOut2 = {
            address: from_address,
            value: { "lovelace": 0 }
        }
        txOut.push(txOut2)
    }

    const options = {
        txIn: txIn,
        txOut: txOut,
        fee: 0
    }

    const buildraw = cardanocliJs.transactionBuildRaw(options)

    const feeOptions = {
        txBody: buildraw,
        txIn: txIn,
        txOut: txOut,
        witnessCount: 1
    }
    const fee = cardanocliJs.transactionCalculateMinFee(feeOptions)

    res.send({
        code: 200,
        data: {
            lovelace: fee
        }
    })
}


exports.submittx = (req, res) => {
    var { address, amount, from_address, txOutCount, fee, account_name } = req.body

    const txIn = getUTXOlist(from_address, amount)

    let totalLovelace = 0;
    txIn.forEach(utxo => {
        totalLovelace += utxo.value.lovelace;
    })

    var txOut = []
    const txOut1 = {
        address: address,
        value: { "lovelace": amount }
    }
    txOut.push(txOut1)

    if (txOutCount === 2) {
        const returnamount = totalLovelace - fee - amount

        const txOut2 = {
            address: from_address,
            value: { "lovelace": returnamount }
        }
        txOut.push(txOut2)
    }
    console.log(txIn, txOut, fee)
    const buildraw = cardanocliJs.transactionBuildRaw({ txIn: txIn, txOut: txOut, fee: fee })

    let private_key = new NodeRSA(privateKey, 'pkcs8-private');
    const decrypted = private_key.decrypt(account_name, 'utf8');

    const signingKeys = [`./priv/wallet/${decrypted}/${decrypted}.payment.skey`]
    const signTx = cardanocliJs.transactionSign({ signingKeys: signingKeys, txBody: buildraw })

    const submitTx = cardanocliJs.transactionSubmit(signTx)

    res.send({
        code: 200,
        data: { txHash: submitTx }
    })
}

const fsread = async () => {
    fs.readFileSync("", 'utf8')
}