import express from 'express';
import { body, validationResult } from 'express-validator';
import Organization from '../models/organization.js';
import Event from "../models/event.js";

const router = express.Router();

// GET /organizations - Get all organizations
router.get('/', async (req, res) => {
    try {
        const organizations = await Organization.findAll();
        res.json(organizations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /organizations/:org_id - Get an organization by ID
router.get('/:org_id', async (req, res) => {
    const org_id = req.params.org_id;

    try {
        const organization = await Organization.findByPk(org_id, { include: [{ model: Event, as: 'events' }] }); // Include associated events
        if (organization) {
            res.json(organization);
        } else {
            res.status(404).json({ message: 'Organization not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /organizations - Create a new organization
router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('contactEmail').notEmpty().withMessage('Contact email is required').isEmail().withMessage('Invalid email format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, contactEmail } = req.body;

        try {
            const newOrganization = await Organization.create({ name, description, contactEmail });
            res.status(201).json(newOrganization);
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

// PUT /organizations/:org_id - Update an organization by ID
router.put(
    '/:org_id',
    [
        body('name').optional().notEmpty().withMessage('Name cannot be empty'),
        body('description').optional().notEmpty().withMessage('Description cannot be empty'),
        body('contactEmail').optional().isEmail().withMessage('Invalid email format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const org_id = req.params.org_id;
        const { name, description, contactEmail } = req.body;

        try {
            const organization = await Organization.findByPk(org_id);
            if (!organization) {
                return res.status(404).json({ message: 'Organization not found' });
            }

            await organization.update({ name, description, contactEmail });
            res.json(organization);
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

// DELETE /organizations/:org_id - Delete an organization by ID
router.delete('/:org_id', async (req, res) => {
    const org_id = req.params.org_id;

    try {
        const organization = await Organization.findByPk(org_id);
        if (!organization) {
            return res.status(404).json({ message: 'Organization not found' });
        }

        await organization.destroy();
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;