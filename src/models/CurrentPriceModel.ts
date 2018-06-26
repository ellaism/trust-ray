const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate");
const Schema = mongoose.Schema;


/**
 * Model for a single transaction.
 *
 * @type {"mongoose".Schema}
 */
const currentPriceSchema = new Schema({
    timeStamp: {
        type: Number,
        required: true,
        index: true
    },
    query: {
        type: String,
        required: true
    },
    value: {
        type: Schema.Types.Mixed,
        required: true
    },

}, {
    versionKey: false,
});


currentPriceSchema.plugin(mongoosePaginate);

export const CurrentPrice = mongoose.model("CurrentPrice", currentPriceSchema );