const grpc = require('@grpc/grpc-js');
import * as OTPAuth from "otpauth";

import TOTPFactor from "./database/models/totp";
import logger from "./utils/logging";

type Create2FAResponse = {
    secret: string;
    qrCode: string;
}

type Validate2FAResponse = {
    success: boolean;
    status: 'INVALID' | 'VALID';
}

const ISSUER = process.env.ISSUER || "TripConnect"
const SECRET_LENGTH = parseInt(process.env.SECRET_LENGTH || "20");
const MAX_OF_SETTINGS = process.env.MAX_Of_SETTINGS || 1;

export async function createSetting(call: any, callback: any) {
    try {
        let { resourceId, label } = call.request;

        let totp = new OTPAuth.TOTP({
            issuer: ISSUER,
            label,
            secret: new OTPAuth.Secret({ size: SECRET_LENGTH }),
        });

        let settings = await TOTPFactor.findAll({
            where: { resourceId, enabled: true }
        });

        if (settings.length >= MAX_OF_SETTINGS) {
            callback({
                code: grpc.status.ALREADY_EXISTS,
                message: 'The resource already registered two-factor authentication'
            });
            return;
        }

        await TOTPFactor.destroy({
            where: { resourceId, enabled: false }
        });

        let setting = await TOTPFactor.create({
            resourceId,
            label,
            secret: totp.secret.base32,
        });

        let totpSettingResp: Create2FAResponse = {
            secret: setting.secret,
            qrCode: OTPAuth.URI.stringify(totp),
        };

        callback(null, totpSettingResp);
    } catch (err: any) {
        logger.error(err);
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
            setting.enabled = true;
            if (!setting.enabled) await setting.save();
            break;
        }
    }

    callback(null, validateResp);
}
