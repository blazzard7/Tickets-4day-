import express from 'express';
import { body, validationResult } from 'express-validator';
import Event from '../models/event.js';
import Ticket from "../models/ticket.js";
import sequelize from "../config/database.js";

const router = express.Router();

// GET /events - Get all events
router.get('/', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /events/:event_id - Get an event by ID
router.get('/:event_id', async (req, res) => {
    const event_id = req.params.event_id;

    try {
        const event = await Event.findByPk(event_id, { include: [{ model: Ticket, as: 'tickets' }] });  //Include tickets
        if (event) {
            res.json(event);
        } else {
            res.status(404).json({ message: 'Event not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /events/search?category=Technology - Search events by category (example)
router.get('/search', async (req, res) => {
    const { category, location } = req.query;
    try {
        let whereClause = {};
        if (category) {
            whereClause.category = { [Sequelize.Op.iLike]: `%${category}%` }; // Case-insensitive search
        }
        if (location) {
            whereClause.location = { [Sequelize.Op.iLike]: `%${location}%` };
        }

        const filteredEvents = await Event.findAll({
            where: whereClause
        });
        res.json(filteredEvents);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /events - Create a new event
router.post(
    '/',
    [
        body('org_id').notEmpty().withMessage('org_id is required').isUUID().withMessage('Invalid UUID'),
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('date').notEmpty().withMessage('Date is required').isISO8601().toDate().withMessage('Invalid date format'),
        body('location').notEmpty().withMessage('Location is required'),
        body('category').notEmpty().withMessage('Category is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { org_id, name, description, date, location, category } = req.body;

        try {
            const newEvent = await Event.create({ org_id, name, description, date, location, category });
            res.status(201).json(newEvent);
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

// PUT /events/:event_id - Update an event by ID
router.put(
    '/:event_id',
    [
        body('org_id').optional().isUUID().withMessage('Invalid UUID for org_id'),
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('date').optional().isISO8601().toDate().withMessage('Invalid date format'),
        body('location').optional().notEmpty().withMessage('Location cannot be empty'),
        body('category').optional().notEmpty().withMessage('Category cannot be empty')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const event_id = req.params.event_id;
        const { org_id, name, description, date, location, category } = req.body;

        try {
            const event = await Event.findByPk(event_id);
            if (!event) {
                return res.status(404).json({ message: 'Event not found' });
            }

            await event.update({ org_id, name, description, date, location, category });
            res.json(event);
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

// DELETE /events/:event_id - Delete an event by ID
router.delete('/:event_id', async (req, res) => {
    const event_id = req.params.event_id;

    try {
        const event = await Event.findByPk(event_id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        await event.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;