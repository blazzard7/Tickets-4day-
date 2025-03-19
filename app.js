import express from 'express';
import { Sequelize, DataTypes } from 'sequelize';
import { body, validationResult } from 'express-validator';

const app = express();
const port = 3000;

// Database Configuration 
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
    logging: false
});

// Organization Model
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

// Event Model
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

// Ticket Model
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

// Associations
Organization.hasMany(Event, { foreignKey: 'org_id', as: 'events' });
Event.belongsTo(Organization, { foreignKey: 'org_id', as: 'organization' });
Event.hasMany(Ticket, { foreignKey: 'event_id', as: 'tickets' });
Ticket.belongsTo(Event, { foreignKey: 'event_id', as: 'event' });

(async () => {
    try {
        await sequelize.sync({ force: false }); // Use force: true with caution
        console.log('Database synchronized');

        // Seed data (optional)
        if (await Organization.count() === 0) {
            const org1 = await Organization.create({ name: "Tech United", description: "Promotes technology innovation", contactEmail: "info@techunited.com" });
            const org2 = await Organization.create({ name: "Arts Collective", description: "Supporting local artists", contactEmail: "info@artscollective.org" });

            const event1 = await Event.create({ org_id: org1.org_id, name: "Tech Conference 2024", description: "Annual tech conference", date: "2024-11-15", location: "Convention Center", category: "Technology" });
            const event2 = await Event.create({ org_id: org1.org_id, name: "AI Workshop", description: "Hands-on AI workshop", date: "2024-12-01", location: "Tech United HQ", category: "Technology" });
            const event3 = await Event.create({ org_id: org2.org_id, name: "Art Exhibition", description: "Showcasing local artists", date: "2024-10-27", location: "City Gallery", category: "Arts" });

            await Ticket.bulkCreate([
                { event_id: event1.event_id, type: "Regular", price: 100, quantityAvailable: 50 },
                { event_id: event1.event_id, type: "VIP", price: 250, quantityAvailable: 20 },
                { event_id: event2.event_id, type: "General Admission", price: 50, quantityAvailable: 100 },
                { event_id: event3.event_id, type: "Standard", price: 20, quantityAvailable: 75 }
            ]);

            console.log('Database seeded with initial data');
        }

    } catch (error) {
        console.error('Unable to synchronize the database:', error);
    }
})();


// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// --- Organization Routes ---
// GET /organizations - Get all organizations
app.get('/organizations', async (req, res) => {
    try {
        const organizations = await Organization.findAll();
        res.json(organizations);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /organizations/:org_id - Get an organization by ID
app.get('/organizations/:org_id', async (req, res) => {
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
app.post(
    '/organizations',
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
app.put(
    '/organizations/:org_id',
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
app.delete('/organizations/:org_id', async (req, res) => {
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


// --- Event Routes ---
// GET /events - Get all events
app.get('/events', async (req, res) => {
    try {
        const events = await Event.findAll();
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /events/:event_id - Get an event by ID
app.get('/events/:event_id', async (req, res) => {
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
app.get('/events/search', async (req, res) => {
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
app.post(
    '/events',
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
app.put(
    '/events/:event_id',
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
app.delete('/events/:event_id', async (req, res) => {
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

// --- Ticket Routes ---
// GET /tickets - Get all tickets
app.get('/tickets', async (req, res) => {
    try {
        const tickets = await Ticket.findAll();
        res.json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /tickets/:ticket_id - Get a ticket by ID
app.get('/tickets/:ticket_id', async (req, res) => {
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
app.post(
    '/tickets',
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
app.put(
    '/tickets/:ticket_id',
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
app.delete('/tickets/:ticket_id', async (req, res) => {
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


// Root route
app.get('/', (req, res) => {
    res.send('Organization, Event, and Ticket API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});