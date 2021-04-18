const Responses = require('../common/API_Responses');
const getDynamoClient = require('../common/Dynamo');
const jwt = require("jsonwebtoken");

const main = async (params) => {
    try {
        const authorization = params.__ow_headers && params.__ow_headers.authorization;
        const verification = jwt.verify(authorization, params.tokenSecret);

        if (!verification || !verification.is_admin) return Promise.reject(Responses._401({ message: 'Unauthorized' }));

        const Dynamo = getDynamoClient(params);
        pending_verifications = await Dynamo.queryDocumentsSkBeginsAndOtherCondition(params.tableName, "#VERIFICATION", "USER#", "verification_status", "PENDING");

        return Responses._200({ success: true, pending_verifications: pending_verifications });
    } catch (error) {
        console.log(error)
        return Promise.reject(Responses._400({ message: 'Could not get pending verifications' }));
    }
};


exports.main = main;