import 'dotenv/config';

const grpc = require('@grpc/grpc-js');

import { backendProto } from 'common-utils';
import * as rpcImplementations from './rpc';
import logger from './utils/logging';

const PORT = process.env.TWOFA_SERVICE_PORT || 31074;

function start() {
    let server = new grpc.Server();
    server.addService(backendProto.twofa_service.TwoFA.service, rpcImplementations);
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err: any, port: any) => {
        if (err != null) {
            return logger.error(err);
        }
        logger.info(`gRPC listening on ${port}`);
    });
}

start();
