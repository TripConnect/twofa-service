import * as grpc from '@grpc/grpc-js';
import * as OTPAuth from "otpauth";
import { sendUnaryData, ServerUnaryCall } from "@grpc/grpc-js";
import { ITwoFactorAuthenticationServiceServer } from "node-proto-lib/protos/twofa_service_grpc_pb";
import { Create2faRequest, Create2faResponse, Generate2faRequest, Generate2faResponse, Validate2faRequest, Validate2faResponse, ValidationStatus } from "node-proto-lib/protos/twofa_service_pb";

import kafkaProducer from 'services/kafka/producer';
import logger from "utils/logging";
import { ConfigHelper } from "common-utils";
import TOTPFactor from "database/models/totp";

const ISSUER = ConfigHelper.read("authenticator.issuer")
const SECRET_LENGTH = ConfigHelper.read("authenticator.secret-length");

export const twofaServiceImp: ITwoFactorAuthenticationServiceServer = {
    generateSetting: async function (
        call: ServerUnaryCall<Generate2faRequest, Generate2faResponse>,
        callback: sendUnaryData<Generate2faResponse>) {
        try {
            let { label } = call.request.toObject();

            let totp = new OTPAuth.TOTP({
                issuer: ISSUER,
                label,
                secret: new OTPAuth.Secret({ size: SECRET_LENGTH }),
            });


            let totpSettingResp = new Generate2faResponse()
                .setSecret(totp.secret.base32)
                .setQrCode(OTPAuth.URI.stringify(totp));

            callback(null, totpSettingResp);
        } catch (err: any) {
            logger.error(err);
            callback(err, null);
        }
    },

    createSetting: async function (
        call: ServerUnaryCall<Create2faRequest, Create2faResponse>,
        callback: sendUnaryData<Create2faResponse>) {
        try {
            let { resourceId, label, secret, otp } = call.request.toObject();

            let totp = new OTPAuth.TOTP({
                issuer: ISSUER,
                label,
                secret,
            });

            let delta = totp.validate({ token: otp });
            if (delta === 0) {
                let setting = await TOTPFactor.create({
                    resourceId,
                    secret,
                });
                await kafkaProducer.publish({
                    topic: ConfigHelper.read('kafka.topic.user-fct-enabled-2fa') as string,
                    message: JSON.stringify({ resourceId: setting.resourceId })
                });
                let resp = new Create2faResponse()
                    .setResourceId(setting.resourceId);
                callback(null, resp);
            } else {
                callback({
                    code: grpc.status.INVALID_ARGUMENT,
                    message: 'Invalid authentication otp'
                });
            }
        } catch (err: any) {
            logger.error("An error occurred:", {
                message: err.message,
                stack: err.stack,
            });
            callback(err, null);
        }
    },

    validateResource: async function (
        call: ServerUnaryCall<Validate2faRequest, Validate2faResponse>,
        callback: sendUnaryData<Validate2faResponse>) {
        let { resourceId, otp } = call.request.toObject();

        let settings = await TOTPFactor.findAll({
            where: {
                resourceId,
            }
        });

        let validateResp = new Validate2faResponse()
            .setSuccess(false)
            .setStatus(ValidationStatus.INVALID);

        for (let setting of settings) {
            let totp = new OTPAuth.TOTP({
                issuer: ISSUER,
                label: setting.label,
                secret: setting.secret,
            });
            let delta = totp.validate({ token: otp });
            if (delta === 0) {
                validateResp.setSuccess(true);
                validateResp.setStatus(ValidationStatus.VALID);
                break;
            }
        }

        callback(null, validateResp);
    }
}
