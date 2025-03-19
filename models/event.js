import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Organization from './organization.js'; // Import the Organization model

const Event = sequelize.define('Event', {
    event_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    org_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Organization,
            key: 'org_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
    date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
            isDate: { msg: 'Invalid date format' }
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Location cannot be empty' }
        }
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Category cannot be empty' }
        }
    }
}, {
    tableName: 'events',
    timestamps: true
});

export default Event;

