// mongodb+srv://rupesh02:<password>@contactkeeper-zfqwy.mongodb.net/test?retryWrites=true&w=majority

const express = require('express');

const router = express.Router();
const jwt = require('jsonwebtoken');
const config = require('config');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');

// @route       GET api/auth
// @desc        Get Logged in User
// @access      Private

// as this route is private and we need to make this route as protected so we have
// passes 'auth' as second parameter (unless we have access(token), we cant access this)
router.get('/', auth,
    async (req, res) => {
        try {
            const user = await User.findById(req.user.id).select('-password');
            res.json(user);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route       POST api/auth
// @desc        Auth user & get token (Login route)
// @access      Public      
router.post('/',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });
            // If user(entered email) does not exists
            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials - User does not exists' })
            }

            // If user(entered email) exists

            // isMatch to compare the entered password and user password stored in db
            // returns true or false
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials - Incorrect Password' });
            }

            // If password matches, we are sending the token
            const payload = {
                user: {
                    id: user.id
                }
            }

            jwt.sign(payload, config.get('jwtSecret'),
                {
                    expiresIn: 36000
                },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token: token })      // we are getting the token here
                });


        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
        // res.send('Log in user');
    });

module.exports = router;
