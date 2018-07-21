import { App } from "./App";
import { ERC20Contract } from "./models/Erc20ContractModel";

const mongoose = require("mongoose");

const app = new App();

const re = new RegExp("0", "i");
ERC20Contract.find({ "address": { $regex: re }}).exec().then((contracts: any) => {

    const result = contracts.map((contract:any) => {
       return {
           address: contract.address,
           symbol: contract.symbol,
           name: contract.name,
           decimal: contract.decimals,
       };
    });

    console.log(result);
}).catch((err: Error) => {
    console.log(err);
});