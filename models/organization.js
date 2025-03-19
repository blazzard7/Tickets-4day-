import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Organization = sequelize.define('Organization', {
    org_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Name cannot be empty' }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Description cannot be empty' }
        }
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Contact email cannot be empty' },
            isEmail: { msg: 'Invalid email format' }
        }
    }
}, {
    tableName: 'organizations',
    timestamps: true
});

export default Organization;