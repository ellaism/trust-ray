import { App } from "./App";
import { ERC20Contract } from "./models/Erc20ContractModel";
import { TransactionOperation } from "./models/TransactionOperationModel";

const mongoose = require("mongoose");

const app = new App();

ERC20Contract.find().exec( async function (err, contracts) {
    const m = contracts.map(function (contract) {
        const theContract = contract;
        const res = TransactionOperation.aggregate([{$match: {contract: mongoose.Types.ObjectId(contract._id)}}, {$group: {_id: {to: "$to"}, total: {$sum: 1}}}, {$count: "holders"}]).exec().then( holders => {
            theContract.update({holdersCount: holders[0].holders}).exec();
            console.log(theContract.symbol + " " + holders[0].holders.toString());
        });
        return res;
    });

    Promise.all(m).then(results => {
        console.log("Done!");
        process.exit();
    });
});