import TOTPFactor from "./database/models/totp";
import logger from "./utils/logging";

type Create2FAResponse = {
    secret: string;
    qrCode: string;
}

export async function createSetting(call: any, callback: any) {
    let { resourceId, label } = call.request;
    let issuer = process.env.ISSUER || "TripConnect";
    let secret = "foo";

    try {
        await TOTPFactor.create({
            resourceId,
            label,
            secret,
        });

        let totpSettingResp: Create2FAResponse = {
            secret,
            qrCode: `otpauth://totp/${label}:${secret}?secret=${secret}&issuer=${issuer}`,
        };

        callback(null, totpSettingResp);
    } catch (err) {
        logger.error(err);
        callback(err, null);
    }
}

export async function validateResource(call: any, callback: any) {

}