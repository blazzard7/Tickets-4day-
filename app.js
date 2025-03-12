import express from 'express';

const app = express();
const port = 3000;

// Entity 1: Organization (Parent Class)
class Organization {
    constructor(org_id, name, description, contactEmail) {
        this.org_id = org_id;
        this.name = name;
        this.description = description;
        this.contactEmail = contactEmail;
    }

    describe() {
        return `Organization: ${this.name} - ${this.description}. Contact: ${this.contactEmail}`;
    }
}

// Entity 2: Event (Child Class inheriting from Organization)
class Event extends Organization {
    constructor(event_id, org_id, name, description, date, location, category) {
        super(org_id, null, null, null); 
        this.event_id = event_id;
        this.org_id = org_id;
        this.name = name;
        this.description = description;
        this.date = date;
        this.location = location;
        this.category = category;
    }

    displayEvent() {
        return `Event: ${this.name} on ${this.date} at ${this.location}. Category: ${this.category}`;
    }
}

// Entity 3:  Ticket (Represents tickets for an Event)
class Ticket {
    constructor(ticket_id, event_id, type, price, quantityAvailable) {
        this.ticket_id = ticket_id;
        this.event_id = event_id;
        this.type = type;
        this.price = price;
        this.quantityAvailable = quantityAvailable;
    }

    displayTicket() {
        return `Ticket: ${this.type} - $${this.price}.  Available: ${this.quantityAvailable}`;
    }
}

// Storage
let organizations = [
    new Organization("ORG001", "Tech United", "Promotes technology innovation", "info@techunited.com"),
    new Organization("ORG002", "Arts Collective", "Supporting local artists", "info@artscollective.org")
];

let events = [
    new Event("EVENT001", "ORG001", "Tech Conference 2024", "Annual tech conference", "2024-11-15", "Convention Center", "Technology"),
    new Event("EVENT002", "ORG001", "AI Workshop", "Hands-on AI workshop", "2024-12-01", "Tech United HQ", "Technology"),
    new Event("EVENT003", "ORG002", "Art Exhibition", "Showcasing local artists", "2024-10-27", "City Gallery", "Arts")
];

let tickets = [
    new Ticket("TICKET001", "EVENT001", "Regular", 100, 50),
    new Ticket("TICKET002", "EVENT001", "VIP", 250, 20),
    new Ticket("TICKET003", "EVENT002", "General Admission", 50, 100),
    new Ticket("TICKET004", "EVENT003", "Standard", 20, 75),
];

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Routes for Organizations
// GET /organizations - Get all organizations
app.get('/organizations', (req, res) => {
    res.json(organizations);
});

// GET /organizations/:org_id - Get an organization by ID
app.get('/organizations/:org_id', (req, res) => {
    const org_id = req.params.org_id;
    const organization = organizations.find(org => org.org_id === org_id);

    if (organization) {
        res.json(organization);
    } else {
        res.status(404).json({ message: 'Organization not found' });
    }
});

// POST /organizations - Create a new organization
app.post('/organizations', (req, res) => {
    const { name, description, contactEmail } = req.body;

    if (!name || !description || !contactEmail) {
        return res.status(400).json({ message: 'Missing required fields (name, description, contactEmail)' });
    }

    const new_org_id = String(Date.now());
    const newOrganization = new Organization(new_org_id, name, description, contactEmail);
    organizations.push(newOrganization);
    res.status(201).json(newOrganization);
});

// PUT /organizations/:org_id - Update an organization by ID
app.put('/organizations/:org_id', (req, res) => {
    const org_id = req.params.org_id;
    const { name, description, contactEmail } = req.body;

    const orgIndex = organizations.findIndex(org => org.org_id === org_id);

    if (orgIndex !== -1) {
        organizations[orgIndex] = { ...organizations[orgIndex], name, description, contactEmail };
        res.json(organizations[orgIndex]);
    } else {
        res.status(404).json({ message: 'Organization not found' });
    }
});

// DELETE /organizations/:org_id - Delete an organization by ID
app.delete('/organizations/:org_id', (req, res) => {
    const org_id = req.params.org_id;
    organizations = organizations.filter(org => org.org_id !== org_id);

    // Also delete associated events and tickets
    events = events.filter(event => event.org_id !== org_id);
    tickets = tickets.filter(ticket => events.find(e => e.event_id === ticket.event_id) == null);

    res.status(204).send();
});

// Routes for Events
// GET /events - Get all events
app.get('/events', (req, res) => {
    res.json(events);
});

// GET /events/:event_id - Get an event by ID
app.get('/events/:event_id', (req, res) => {
    const event_id = req.params.event_id;
    const event = events.find(event => event.event_id === event_id);

    if (event) {
        res.json(event);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
});

// POST /events - Create a new event
app.post('/events', (req, res) => {
    const { org_id, name, description, date, location, category } = req.body;

    if (!org_id || !name || !date || !location || !category) {
        return res.status(400).json({ message: 'Missing required fields (org_id, name, date, location, category)' });
    }

    const new_event_id = String(Date.now());
    const newEvent = new Event(new_event_id, org_id, name, description, date, location, category);
    events.push(newEvent);
    res.status(201).json(newEvent);
});

// PUT /events/:event_id - Update an event by ID
app.put('/events/:event_id', (req, res) => {
    const event_id = req.params.event_id;
    const { org_id, name, description, date, location, category } = req.body;

    const eventIndex = events.findIndex(event => event.event_id === event_id);

    if (eventIndex !== -1) {
        events[eventIndex] = { ...events[eventIndex], org_id, name, description, date, location, category };
        res.json(events[eventIndex]);
    } else {
        res.status(404).json({ message: 'Event not found' });
    }
});

// DELETE /events/:event_id - Delete an event by ID
app.delete('/events/:event_id', (req, res) => {
    const event_id = req.params.event_id;
    events = events.filter(event => event.event_id !== event_id);

    //Also delete tickets tied to the event
    tickets = tickets.filter(ticket => ticket.event_id !== event_id);

    res.status(204).send();
});

// GET /events/search?category=Technology - Search events by category (example)
app.get('/events/search', (req, res) => {
    const { category, location } = req.query;
    let filteredEvents = events;

    if (category) {
        filteredEvents = filteredEvents.filter(event => event.category.toLowerCase() === category.toLowerCase());
    }

    if (location) {
        filteredEvents = filteredEvents.filter(event => event.location.toLowerCase().includes(location.toLowerCase()));
    }

    res.json(filteredEvents);
});


// Routes for Tickets
// GET /tickets - Get all tickets
app.get('/tickets', (req, res) => {
    res.json(tickets);
});

// GET /tickets/:ticket_id - Get a ticket by ID
app.get('/tickets/:ticket_id', (req, res) => {
    const ticket_id = req.params.ticket_id;
    const ticket = tickets.find(ticket => ticket.ticket_id === ticket_id);

    if (ticket) {
        res.json(ticket);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// POST /tickets - Create a new ticket
app.post('/tickets', (req, res) => {
    const { event_id, type, price, quantityAvailable } = req.body;

    if (!event_id || !type || !price || !quantityAvailable) {
        return res.status(400).json({ message: 'Missing required fields (event_id, type, price, quantityAvailable)' });
    }

    const new_ticket_id = String(Date.now());
    const newTicket = new Ticket(new_ticket_id, event_id, type, price, quantityAvailable);
    tickets.push(newTicket);
    res.status(201).json(newTicket);
});

// PUT /tickets/:ticket_id - Update a ticket by ID
app.put('/tickets/:ticket_id', (req, res) => {
    const ticket_id = req.params.ticket_id;
    const { event_id, type, price, quantityAvailable } = req.body;

    const ticketIndex = tickets.findIndex(ticket => ticket.ticket_id === ticket_id);

    if (ticketIndex !== -1) {
        tickets[ticketIndex] = { ...tickets[ticketIndex], event_id, type, price, quantityAvailable };
        res.json(tickets[ticketIndex]);
    } else {
        res.status(404).json({ message: 'Ticket not found' });
    }
});

// DELETE /tickets/:ticket_id - Delete a ticket by ID
app.delete('/tickets/:ticket_id', (req, res) => {
    const ticket_id = req.params.ticket_id;
    tickets = tickets.filter(ticket => ticket.ticket_id !== ticket_id);
    res.status(204).send();
});


// Root route
app.get('/', (req, res) => {
    res.send('Organization, Event, and Ticket API is running!');
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});