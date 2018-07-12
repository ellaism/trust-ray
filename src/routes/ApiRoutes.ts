import  * as express from "express";
import { TransactionController } from "../controllers/TransactionController";
import { EllaismTokenController } from "../controllers/EllaismTokenController";
import { StatusController } from "../controllers/StatusController";
import { Pusher } from "../controllers/PusherController";
import { PriceController } from "../controllers/PriceController";
import { EllaismPriceController } from "../controllers/EllaismPriceController";
import { TokenPriceController } from "../controllers/TokenPriceController";
import { AssetsController } from "../controllers/AssestsController";

const router = express.Router();

const transactionController = new TransactionController();
const ellaismTokenController = new EllaismTokenController();
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
router.get("/tokens", ellaismTokenController.readAllTokens);
router.get("/tokens/list", ellaismTokenController.listTokens);
router.get("/tokens/list/new", ellaismTokenController.listTokensNew);
router.get("/tokens/:address", ellaismTokenController.readOneToken);
router.get("/tokenInfo/:tokenAddress", ellaismTokenController.readTokenInfo);

// URLs for push notifications
router.post("/push/register", pusherController.register);
router.delete("/push/unregister", pusherController.unregister);

router.get("/prices", priceController.getPrices);
router.post("/tokenPrices", tokenPriceController.getTokenPrices);

// URLs for assets
router.get("/assets", assetsController.getAssets);


// All the end points below this point were added for the Android wallet, a fork of Lunary Ethereum wallet
// They do not apply to the fork of trust-wallet-ios
router.get("/returnChartData", ellaismPriceController.getHistoricalPrices);
router.get("/currentPrice", ellaismPriceController.getCurrentPrice);
router.get("/account_balancemulti", ellaismPriceController.accountBalanceMulti);
router.get("/account_balance", ellaismPriceController.accountBalance);
router.get("/estimateGas", ellaismPriceController.estimateGas);
router.get("/gasPrice", ellaismPriceController.gasPrice);
router.get("/getTransactionCount", ellaismPriceController.getTransactionCount);
router.get("/sendRawTransaction", ellaismPriceController.sendRawTransaction);

router.get("/txlist", ellaismPriceController.txlist);
router.get("/txlistinternal", ellaismPriceController.txlistinternal);

router.get("/getAddressInfo/:address", ellaismTokenController.getAddressInfo);

export {
    router
};