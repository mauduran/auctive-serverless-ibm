const Responses = require('../common/API_Responses');
const getDynamoClient = require('../common/Dynamo');
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');

const createNotification = async (info, email, auctionId, auctionTitle, message, emitter) => {
  const Dynamo = getDynamoClient(info);

  let notificationId = uuidv4();

  let notification = {
    PK: `USER#${email}`,
    SK: `#NOTIFICATION#${notificationId}`,
    notification_id: notificationId,
    auctionId: auctionId,
    auctionTitle: auctionTitle,
    message: message,
    date: new Date().toISOString(),
    emitter: emitter
  }
  return Dynamo.writeIfNotExists(info.tableName, notification, 'PK');
}

const updateVerificationRequest = async (info, userEmail, status) => {
  const Dynamo = getDynamoClient(info);

  params = {
    Key: {
      "PK": `#VERIFICATION`,
      "SK": `USER#${userEmail}`
    },
    UpdateExpression: "set verification_status = :new_status",
    ExpressionAttributeValues: {
      ":new_status": status,
    },
  }
  return await Dynamo.updateDocument(info.tableName, params);
}

const updateUserVerification = async (info, email) => {
  const Dynamo = getDynamoClient(info);
  let params = {
    Key: {
      "PK": `USER#${email}`,
      "SK": `#PROFILE#${email}`
    },
    UpdateExpression: "set is_verified = :is_verified, pending_verification = :pending_verification",
    ExpressionAttributeValues: {
      ":is_verified": true,
      ":pending_verification": false
    },
    IndexName: 'email-index',
  }
  return await Dynamo.updateDocument(info.tableName, params);
}

const main = async params => {
  try {
    const email = params.email;
    let verificationStatus = params.verificationStatus;

    if (!email || !verificationStatus) Responses._400({ error: true, message: 'Missing fields' });

    const authorization = params.__ow_headers && params.__ow_headers.authorization;
    const verification = jwt.verify(authorization, params.tokenSecret);

    if (!verification || !verification.is_admin) return Promise.reject(Responses._401({ message: 'Unauthorized' }));

    message = verificationStatus == "ACCEPTED" ? "Tu solicitud de verificación ha sido aceptada" : "Tu solicitud de verificación ha sido denegada";
    
    if(verificationStatus!="ACCEPTED") verificationStatus = "REJECTED";

    request_verify = await updateVerificationRequest(params, email, verificationStatus);

    await createNotification(params, email, "", "", message, verification.email);

    if (verificationStatus == "ACCEPTED") await updateUserVerification(params, email);

    return Responses._200({ success: true, verification: request_verify });
  } catch (error) {
    console.log(error);
    return Responses._400({ message: 'Could not update verification request' });
  }
};

exports.main = main;
