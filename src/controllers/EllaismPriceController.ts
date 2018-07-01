import {Request, Response} from "express";
import {sendJSONresponse} from "../common/Utils";
import axios from "axios";
import {Promise} from "bluebird";
import {HistoricalPrice} from "../models/HistoricalPriceModel";
import {CurrentPrice} from "../models/CurrentPriceModel";
import { Config } from "../common/Config";
import { Transaction } from "../models/TransactionModel";

export class EllaismPriceController {

    getCurrentPrice = (req: Request, res: Response) => {
        const query = "getCurrentPrice";

        var q = CurrentPrice.findOne({query: query, timeStamp: {$gt: Date.now() - (1000 * 60)}});
        var originalThis = this;
        q.exec(function (err, result) {
            if (err) {
                return err;
            }
            if (result) {
                sendJSONresponse(res, 200, {
                    status: "1",
                    message: "OK",
                    result: originalThis.filterCurrentPrice(result.value),
                });
            } else {
                originalThis.getRemoteCurrentPrice().then((price: any) => {
                    const transaction = new Transaction();
                    try {
                        CurrentPrice.deleteMany({query: query});
                        CurrentPrice.create({query: query, timeStamp: Date.now(), value: price.data});
                        sendJSONresponse(res, 200, {
                            status: "1",
                            message: "OK",
                            result: originalThis.filterCurrentPrice(price.data),
                        });
                    } catch (error) {
                        console.error(error)
                        transaction.rollback().catch(console.error);
                        transaction.clean();
                        sendJSONresponse(res, 500, {
                            status: 500,
                            error: error.toString(),
                        });
                    }
                }).catch((error: Error) => {
                    console.error(error);
                    sendJSONresponse(res, 500, {
                        status: 500,
                        error: error.toString(),
                    });
                });
            }
        });
    };

    gasPrice = (req: Request, res: Response) => {
        Config.web3.eth.gasPrice().then(result => {
            sendJSONresponse(res, 200, result);
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });;
    };

    getTransactionCount = (req: Request, res: Response) => {
        Config.web3.eth.getTransactionCount(req.query.data, req.query.tag).then(result => {
            sendJSONresponse(res, 200, {jsonrpc: "2.0", id: 1, result: '0x' + result.toString(16)});
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });
    };

    txlist = (req: Request, res: Response) => {
        const address = req.query.address.toLowerCase();
        const startBlock = req.query.startblock;
        const endBlock = req.query.endblock;
        const sort = req.query.sort;

        const query: any = {};
        query.addresses = { "$in": [address] };
        query.blockNumber = { "$gte": startBlock, "$lte": endBlock};
        query.contract = null;

        Transaction.find(query, null, {
            sort: {timeStamp: sort === "asc" ? 1 : -1}
        }).then((transactions: any) => {
            transactions = transactions.map(t => {
                var x = t.toObject();
                x.hash = x.id;
                delete x.id;
                delete x._id;
                return x;
            });
            sendJSONresponse(res, 200, {"status": "1", "message": "OK", "result": transactions});
        }).catch((err: Error) => {
            sendJSONresponse(res, 404, err);
        });
    };

    txlistinternal = (req: Request, res: Response) => {
        const address = req.query.address.toLowerCase();
        const startBlock = req.query.startblock;
        const endBlock = req.query.endblock;
        const sort = req.query.sort;

        const query: any = {};
        query.addresses = { "$in": [address] };
        query.blockNumber = { "$gte": startBlock, "$lte": endBlock};
        query.contract = { $ne: null };

        Transaction.find(query, null, {
            sort: {timeStamp: sort === "asc" ? 1 : -1}
        }).then((transactions: any) => {
            transactions = transactions.map(t => {
                var x = t.toObject();
                x.hash = x.id;
                delete x.id;
                delete x._id;
                return x;
            });
            sendJSONresponse(res, 200, {"status": "1", "message": "OK", "result": transactions});
        }).catch((err: Error) => {
            sendJSONresponse(res, 404, err);
        });
    };

    sendRawTransaction = (req: Request, res: Response) => {
        Config.web3.eth.sendSignedTransaction(req.query.hex).then(result => {
            sendJSONresponse(res, 200, result);
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });
    };

    estimateGas = (req: Request, res: Response) => {
        const to_param = req.query.to;
        const value = req.query.value;
        const gasPrice = req.query.gasPrice;
        const gas = req.query.gas;
        Config.web3.eth.estimateGas({
            'to': to_param,
            value: value,
            gasPrice: gasPrice,
            gas: gas
        }).then(result => {
            sendJSONresponse(res, 200, result);
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });
    };

    accountBalance = (req: Request, res: Response) => {
        const address = req.query.address;
        Config.web3.eth.getBalance(address).then(result => {
            sendJSONresponse(res, 200, {result: result});
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });
    };

    accountBalanceMulti = (req: Request, res: Response) => {
        const address_param = req.query.address;
        const addresses = address_param.split(',');

        var balances = [];
        addresses.forEach( address => {
            balances.push(Config.web3.eth.getBalance(address));
        });

        var results = [];
        Promise.all(balances).then( balance_results => {
            balance_results.forEach( (r, i) => {
                results.push({"account": addresses[i], "balance": r });
            });

            sendJSONresponse(res, 200, {
                status: "1",
                message: "OK",
                result: results
            });
        }).catch((error: Error) => {
            console.error(error);
            sendJSONresponse(res, 500, {
                status: 500,
                error: error.toString(),
            });
        });
    };

    getHistoricalPrices = (req: Request, res: Response) => {
        const fsym = req.query.fsym || "ELLA";
        const tsym = req.query.tsym || "BTC";
        const period = req.query.period || "histoday";
        const limit = req.query.limit || 30;

        const query = "getHistoricalPrices" + '_' + fsym + '_' + tsym + '_' + period + '_' + limit;
        var q = HistoricalPrice.findOne({query: query, timeStamp: {$gt: Date.now() - (1000 * 60)}});
        var originalThis = this;
        q.exec(function (err, result) {
            if (err) {
                return err;
            }
            if (result) {
                sendJSONresponse(res, 200, {
                    status: true,
                    response: originalThis.filterHistoricalPrices(result.value, fsym, tsym),
                });
            } else {
                originalThis.getRemoteHistoricalPrices(fsym, tsym, period, limit).then((prices: any) => {
                    const transaction = new Transaction();
                    try {
                        HistoricalPrice.deleteMany({query: query});
                        HistoricalPrice.create({query: query, timeStamp: Date.now(), value: prices.data.Data});
                        sendJSONresponse(res, 200, {
                            status: true,
                            response: originalThis.filterHistoricalPrices(prices.data.Data, fsym, tsym),
                        });
                    } catch (error) {
                        console.error(error)
                        transaction.rollback().catch(console.error);
                        transaction.clean();
                        sendJSONresponse(res, 500, {
                            status: 500,
                            error: error.toString(),
                        });
                    }
                }).catch((error: Error) => {
                    console.error(error);
                    sendJSONresponse(res, 500, {
                        status: 500,
                        error: error.toString(),
                    });
                });
            }
        });
    };

    private filterCurrentPrice(price: any): any {
        return {
            "ethbtc": "" + price.BTC,
            "ethbtc_timestamp": "" + Math.round(Date.now() / 1000),
            "ethusd": "" + price.USD,
            "ethusd_timestamp": "" + Math.round(Date.now() / 1000)
        };
    }

    private filterHistoricalPrices(prices: any[], symbol: string, currency: string): any {
        return prices.map((price) => {
            return {
                symbol: symbol,
                price: price.close || "0",
                date: price.time
            }
        });
    }

    private getRemoteCurrentPrice() {
        return new Promise((resolve, reject) => {
            const url = "https://min-api.cryptocompare.com/data/price?fsym=ELLA&tsyms=BTC,USD";
            const a = axios.get(url);
            resolve(a);
        });
    };

    private getRemoteHistoricalPrices(fsym: string, tsym: string, period: string, limit: number) {
        return new Promise((resolve, reject) => {
            const url = "https://min-api.cryptocompare.com/data/" + encodeURIComponent(period) + "?fsym=" + encodeURIComponent(fsym) + "&tsym=" + encodeURIComponent(tsym) + "&limit=" + encodeURIComponent(limit.toString());
            const a = axios.get(url);
            resolve(a);
        });
    };
}
