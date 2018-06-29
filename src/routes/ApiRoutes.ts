import  * as express from "express";
import { TransactionController } from "../controllers/TransactionController";
import { TokenController } from "../controllers/TokenController";
import { StatusController } from "../controllers/StatusController";
import { Pusher } from "../controllers/PusherController";
import { PriceController } from "../controllers/PriceController";
import { EllaismPriceController } from "../controllers/EllaismPriceController";
import { TokenPriceController } from "../controllers/TokenPriceController";
import { AssetsController } from "../controllers/AssestsController";

const router = express.Router();

const transactionController = new TransactionController();
const tokenController = new TokenController();
const statusController = new StatusController();
const pusherController = new Pusher();
const priceController = new PriceController();
const ellaismPriceController = new EllaismPriceController();
const tokenPriceController = new TokenPriceController();
const assetsController = new AssetsController();

// URLs for transactions
router.get("/", statusController.getStatus);
router.get("/transactions", transactionController.readAllTransactions);
router.get("/transactions/:transactionId", transactionController.readOneTransaction);

// URLs for tokens
router.get("/tokens", tokenController.readAllTokens);
router.get("/tokens/list", tokenController.listTokens);
router.get("/tokens/list/new", tokenController.listTokensNew);
router.get("/tokens/:address", tokenController.readOneToken);
router.get("/tokenInfo/:tokenAddress", tokenController.readTokenInfo);

// URLs for push notifications
router.post("/push/register", pusherController.register);
router.delete("/push/unregister", pusherController.unregister);

router.get("/prices", priceController.getPrices);
router.post("/tokenPrices", tokenPriceController.getTokenPrices);

// URLs for assets
router.get("/assets", assetsController.getAssets);

router.get("/returnChartData", ellaismPriceController.getHistoricalPrices);
router.get("/currentPrice", ellaismPriceController.getCurrentPrice);
router.get("/account_balancemulti", ellaismPriceController.accountBalanceMulti);
router.get("/account_balance", ellaismPriceController.accountBalance);
router.get("/estimateGas", ellaismPriceController.estimateGas);
router.get("/gasPrice", ellaismPriceController.gasPrice);
router.get("/getTransactionCount", ellaismPriceController.getTransactionCount);
router.get("/sendRawTransaction", ellaismPriceController.sendRawTransaction);

export {
    router
};