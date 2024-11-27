const grpc = require('@grpc/grpc-js');
import * as OTPAuth from "otpauth";
import kafkajs, { Kafka } from 'kafkajs';

import TOTPFactor from "./database/models/totp";
import kafkaProducer from './services/kafka/producer';
import logger from "./utils/logging";

type Generate2FAResponse = {
    secret: string;
    qrCode: string;
}

type Create2FAResponse = {
    resourceId: string;
}

type Validate2FAResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

const ISSUER = process.env.ISSUER || "TripConnect"
const SECRET_LENGTH = parseInt(process.env.SECRET_LENGTH || "20");

export async function generateSetting(call: any, callback: any) {
    try {
        let { label } = call.request;

        let totp = new OTPAuth.TOTP({
            issuer: ISSUER,
            label,
            secret: new OTPAuth.Secret({ size: SECRET_LENGTH }),
        });

        let totpSettingResp: Generate2FAResponse = {
            secret: totp.secret.base32,
            qrCode: OTPAuth.URI.stringify(totp),
        };

        callback(null, totpSettingResp);
    } catch (err: any) {
        logger.error(err);
        callback(err, null);
    }
}

export async function createSetting(call: any, callback: any) {
    try {
        let { resourceId, label, secret, otp } = call.request;

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
                topic: 'user_updated_for_twofa',
                message: JSON.stringify({ resourceId: setting.resourceId })
            });
            let resp: Create2FAResponse = {
                resourceId: setting.resourceId
            };
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
}

export async function validateResource(call: any, callback: any) {
    let { resourceId, otp } = call.request;

    let settings = await TOTPFactor.findAll({
        where: {
            resourceId,
        }
    });

    let validateResp: Validate2FAResponse = {
        success: false,
        status: "INVALID",
    };

    for (let setting of settings) {
        let totp = new OTPAuth.TOTP({
            issuer: ISSUER,
            label: setting.label,
            secret: setting.secret,
        });
        let delta = totp.validate({ token: otp });
        if (delta === 0) {
            validateResp.success = true;
            validateResp.status = "VALID";
            break;
        }
    }

    callback(null, validateResp);
}
