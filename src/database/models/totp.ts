import { DataTypes } from 'sequelize';
import db from '.';

const TOTPFactor = db.sequelize.define('totp_factor_settings', {
    resourceId: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    secret: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'totp_factor_settings',
    timestamps: false,
});

export default TOTPFactor;
