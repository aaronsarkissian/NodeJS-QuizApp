import * as mongoose from 'mongoose';

const expireTokenSchema: mongoose.Schema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    token: {type: String, expires: 60 * 60}, // 1 Hour
});

const ExpireToken = mongoose.model('ExpireToken', expireTokenSchema);
export default ExpireToken;
