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

export async function createSetting(call: any, callback: any) {
    try {
        let { resourceId, label } = call.request;
        let secretLength = parseInt(process.env.SECRET_LENGTH || "20");

        let totp = new OTPAuth.TOTP({
            issuer: process.env.ISSUER || "TripConnect",
            label,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
            secret: new OTPAuth.Secret({ size: secretLength }),
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
    } catch (err) {
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
            issuer: process.env.ISSUER || "TripConnect",
            label: setting.label,
            algorithm: "SHA1",
            digits: 6,
            period: 30,
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
