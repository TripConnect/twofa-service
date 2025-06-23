import { ConfigHelper } from 'common-utils';
import 'dotenv/config';

import * as grpc from '@grpc/grpc-js';
import { TwoFactorAuthenticationServiceService } from "node-proto-lib/protos/twofa_service_grpc_pb";
import { twofaServiceImp } from 'rpc';
import logger from 'utils/logging';

const PORT = ConfigHelper.read("server.port");

function start() {
    let server = new grpc.Server();
    server.addService(TwoFactorAuthenticationServiceService, twofaServiceImp);
    server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
        if (err != null) {
            return logger.error(err);
        }
        logger.info(`gRPC listening on ${port}`);
    });
}

start();
