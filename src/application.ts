import 'dotenv/config';

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

import * as rpcImplementations from './rpc';
import logger from './utils/logging';

let packageDefinition = protoLoader.loadSync(
    require.resolve('common-utils/protos/backend.proto'),
    {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true
    });
let backendProto = grpc.loadPackageDefinition(packageDefinition).backend;

const PORT = process.env.TWOFA_SERVICE_PORT || 31074;

function start() {
    let server = new grpc.Server();
    server.addService(backendProto.TwoFA.service, rpcImplementations);
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err: any, port: any) => {
        if (err != null) {
            return logger.error(err);
        }
        logger.info(`gRPC listening on ${port}`);
    });
}

start();
