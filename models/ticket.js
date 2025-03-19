import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import Event from './event.js'; // Import the Event model

const Ticket = sequelize.define('Ticket', {
    ticket_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    event_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Event,
            key: 'event_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'Type cannot be empty' }
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: false,
        validate: {
            isFloat: { msg: 'Price must be a number' },
            min: { args: [0], msg: 'Price must be non-negative' }
        }
    },
    quantityAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            isInt: { msg: 'Quantity must be an integer' },
            min: { args: [0], msg: 'Quantity must be non-negative' }
        }
    }
}, {
    tableName: 'tickets',
    timestamps: true
});

export default Ticket;

