import {Request, Response} from "express";
import {sendJSONresponse} from "../common/Utils";
import axios from "axios";
import {Promise} from "bluebird";
import {HistoricalPrice} from "../models/HistoricalPriceModel";
import {CurrentPrice} from "../models/CurrentPriceModel";

const Transaction = require('mongoose-transactions');

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
                            error,
                        });
                    }
                }).catch((error: Error) => {
                    console.error(error);
                    sendJSONresponse(res, 500, {
                        status: 500,
                        error,
                    });
                });
            }
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
                            error,
                        });
                    }
                }).catch((error: Error) => {
                    console.error(error);
                    sendJSONresponse(res, 500, {
                        status: 500,
                        error,
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
