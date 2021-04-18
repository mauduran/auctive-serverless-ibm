const aws = require('aws-sdk');


const getS3Client = (params)=>{
    const credentials = new aws.Credentials({accessKeyId: params.accessKeyId, secretAccessKey: params.secretAccessKey})
    
    aws.config.update({
      region: 'us-east-1',
      credentials: credentials
    })
    
    const s3 = new aws.S3();
    
    const S3 = {
        upload(params) {
            return s3.putObject({
                ...params,
                ACL: 'public-read',
            }).promise();
        }
    }

    return S3;

}

module.exports = getS3Client;
