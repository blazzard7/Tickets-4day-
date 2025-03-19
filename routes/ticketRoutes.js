import express from 'express';
import { body, validationResult } from 'express-validator';
import Ticket from '../models/ticket.js';

const router = express.Router();

// GET /tickets - Get all tickets
router.get('/', async (req, res) => {
    try {
        const tickets = await Ticket.findAll();
        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /tickets/:ticket_id - Get a ticket by ID
router.get('/:ticket_id', async (req, res) => {
    const ticket_id = req.params.ticket_id;

    try {
        const ticket = await Ticket.findByPk(ticket_id);
        if (ticket) {
            res.json(ticket);
        } else {
            res.status(404).json({ message: 'Ticket not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /tickets - Create a new ticket
router.post(
    '/',
    [
        body('event_id').notEmpty().withMessage('event_id is required').isUUID().withMessage('Invalid UUID'),
        body('type').notEmpty().withMessage('Type is required'),
        body('price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('quantityAvailable').notEmpty().withMessage('Quantity is required').isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { event_id, type, price, quantityAvailable } = req.body;

        try {
            const newTicket = await Ticket.create({ event_id, type, price, quantityAvailable });
            res.status(201).json(newTicket);
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// PUT /tickets/:ticket_id - Update a ticket by ID
router.put(
    '/:ticket_id',
    [
        body('event_id').optional().isUUID().withMessage('Invalid UUID for event_id'),
        body('type').optional().notEmpty().withMessage('Type cannot be empty'),
        body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
        body('quantityAvailable').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const ticket_id = req.params.ticket_id;
        const { event_id, type, price, quantityAvailable } = req.body;

        try {
            const ticket = await Ticket.findByPk(ticket_id);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            await ticket.update({ event_id, type, price, quantityAvailable });
            res.json(ticket);
        } catch (error) {
            console.error(error);
            if (error.name === 'SequelizeValidationError') {
                const sequelizeErrors = error.errors.map(err => ({
                    param: err.path,
                    msg: err.message
                }));
                return res.status(400).json({ errors: sequelizeErrors });
            }
            res.status(500).json({ message: 'Server error' });
        }
    }
);

// DELETE /tickets/:ticket_id - Delete a ticket by ID
router.delete('/:ticket_id', async (req, res) => {
    const ticket_id = req.params.ticket_id;

    try {
        const ticket = await Ticket.findByPk(ticket_id);
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }

        await ticket.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;