const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Contact = require('../models/Contact');

// @route       GET api/contacts
// @desc        Get all users contacts
// @access      Private      
router.get('/', auth,
    async (req, res) => {
        try {
            // date: -1 = latest created contact comes first
            // req.user.id - we are getting the requested user id from our auth
            // as in auth, we are getting req.user which contains the id
            const contacts = await Contact.find({ user: req.user.id }).sort({ date: -1 });
            res.json(contacts);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route       POST api/contacts
// @desc        Add new contact
// @access      Private      
router.post('/', [auth, [
    check('name', 'Name is required').not().isEmpty()
]],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, phone, type } = req.body;

        try {
            newContact = new Contact({
                name: name,
                email: email,
                phone: phone,
                type: type,
                user: req.user.id   //  we will get user bcz we r using auth middleware
            });

            const contact = await newContact.save();

            res.json(contact);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route       PUT api/contacts/:id
// @desc        Update user contact
// @access      Private      
router.put('/:id', auth,
    async (req, res) => {
        const { name, email, phone, type } = req.body;

        // Build contact object
        const contactFields = {};

        if (name) contactFields.name = name;
        if (email) contactFields.email = email;
        if (phone) contactFields.phone = phone;
        if (type) contactFields.type = type;

        try {
            // this will find the contact by id
            let contact = await Contact.findById(req.params.id);

            // if no contact found
            if (!contact) {
                return res.status(404).json({ msg: 'Contact not found!' });
            }

            // Make sure user owns the contact
            // req.user.id - is actually a string which we are getting from auth
            // thats why we used toString() for comparision
            if (contact.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'Not Authorized' });
            }

            contact = await Contact.findByIdAndUpdate(req.params.id,
                { $set: contactFields },
                { new: true }   // if this contact doesnt exist, then lets just create it
            );

            res.json(contact);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }


        res.send('Update user contact');
    });

// @route       DELETE api/contacts/:id
// @desc        Delete a user contact
// @access      Private      
router.delete('/:id', auth,
    async (req, res) => {
        try {
            let contact = await Contact.findById(req.params.id);

            if (!contact) {
                return res.status(404).json({ msg: 'Contact not found!' });
            }

            // Make sure user owns the contact
            if (contact.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'Not Authorized' });
            }

            await Contact.findByIdAndRemove(req.params.id);

            res.json({ msg: 'Contact Removed SSuccesfully!' });
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

module.exports = router;