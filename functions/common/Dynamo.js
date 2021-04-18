const aws = require('aws-sdk');


const getDynamoClient = (params) => {
    const credentials = new aws.Credentials({ accessKeyId: params.accessKeyId, secretAccessKey: params.secretAccessKey })

    aws.config.update({
        region: 'us-east-1',
        credentials: credentials
    })

    const dynamoDB = new aws.DynamoDB.DocumentClient();

    const Dynamo = {
        async writeIfNotExists(tableName, data, attributeToCheck) {
            params = {
                TableName: tableName,
                Item: data,
                ConditionExpression: `attribute_not_exists(${attributeToCheck})`
            }
            return dynamoDB.put(params).promise()
        },
        async write(tableName, data) {
            params = {
                TableName: tableName,
                Item: data,
            }
            return dynamoDB.put(params).promise()
        },

        async findDocumentByKey(tableName, key) {
            const params = {
                TableName: tableName,
                Key: key
            }

            return dynamoDB.get(params).promise()
                .then(data => data.Item);
        },
        async updateDocument(tableName, params) {

            params = {
                ...params,
                TableName: tableName,
                ReturnValues: "UPDATED_NEW"
            }
            return dynamoDB.update(params).promise()
        },
        async queryDocuments(tableName, params) {
            params = {
                ...params,
                TableName: tableName,
            }
            return dynamoDB.query(params).promise()
                .then(data => {
                    return data.Items
                });
        },
        async queryDocumentsSkBegins(tableName, pk, sk) {
            const params = {
                KeyConditionExpression: "PK = :pk  and begins_with (SK, :sk)",
                ExpressionAttributeValues: {
                    ":pk": pk,
                    ":sk": sk
                },
                TableName: tableName,
            }
            return dynamoDB.query(params).promise()
                .then(data => {
                    return data.Items
                });
        },
        async queryDocumentsSkBeginsAndOtherCondition(tableName, pk, sk, condition, value) {
            const params = {
                KeyConditionExpression: `PK = :pk  and begins_with (SK, :sk)`,
                FilterExpression: `#condition = :condition_value`,
                ExpressionAttributeNames: {
                    '#condition': condition,
                },
                ExpressionAttributeValues: {
                    ":pk": pk,
                    ":sk": sk,
                    ":condition_value": value
                },
                TableName: tableName,
            }
            return dynamoDB.query(params).promise()
                .then(data => {
                    return data.Items
                });
        },
        async queryDocumentsIndex(tableName, index, params) {
            params = {
                TableName: tableName,
                IndexName: index,
                ...params
            }

            return dynamoDB.query(params).promise()
                .then(data => {
                    return data.Items;
                });
        },

        async batchWrite(tableName, requests) {
            const params = {
                RequestItems: {
                    [tableName]: requests
                }
            }
            return dynamoDB.batchWrite(params).promise()
        },

        async deleteDocumentByKey(tableName, pk, sk) {
            const params = {
                TableName: tableName,
                Key: {
                    PK: pk,
                    SK: sk
                }
            }
            return dynamoDB.delete(params).promise();
        },

        async scanDocument(tableName, params) {
            params = {
                TableName: tableName,
                ...params
            }
            return dynamoDB.scan(params).promise().then((data) => data.Items);
        }
    }

    return Dynamo;

}
module.exports = getDynamoClient;
