const Responses = require('../common/API_Responses');
const getDynamoClient = require('../common/Dynamo');
const getS3Client = require('../common/S3');
const allowedMimes = require('../common/allowedMimes');
const imageUtils = require('../common/imageUtils');
const jwt = require("jsonwebtoken");

const createVerificationRequest = async (info, email, imgUrl) => {
  const Dynamo = getDynamoClient(info);

  let data = {
      PK: `#VERIFICATION`,
      SK: `USER#${email}`,
      user_email: email,
      verification_status: "PENDING",
      official_id_url: imgUrl
  }

  return Dynamo.write(info.tableName, data);
}

const main = async (params) => {
  if (!params) return Responses._400({ error: true, message: 'Could not process request.' });

  const authorization = params.__ow_headers && params.__ow_headers.authorization;
  const verification = jwt.verify(authorization, params.tokenSecret);


  if (!verification) return Responses._401({ message: 'Unauthorized' });

  const email = verification.email;

  if (!params.image) return Responses._400({ error: true, message: "Missing fields!" });
  try {
    const S3 = getS3Client(params);

    image = params.image;

    if (!allowedMimes.includes(image.mime)) return Responses._400({ message: 'mime is not allowed' });

    const imageParams = imageUtils.getImageRequest(params.usersBucket, image, email, "verification-id");

    await S3.upload(imageParams);

    let url = `https://${params.usersBucket}.s3.amazonaws.com/${imageParams.Key}`;

    await createVerificationRequest(params, email, url);

    return Responses._200({ success: true, message: "Created verification request" });
  } catch (error) {
    console.log(error);
    return Responses._400({ error: true, message: "Could not create verification request." });
  }

}

exports.main = main;
