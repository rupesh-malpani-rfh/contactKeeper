const express = require('express');
const jwt = require('jsonwebtoken');
const config = require('config');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');

// @route     POST api/users
// @desc      Regiter a user
// @access    Public
router.post(
    '/',
    [
        check('name', 'Please add name')
            .not()
            .isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check(
            'password',
            'Please enter a password with 6 or more characters',
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password } = req.body;

        try {

            let user = await User.findOne({ email });

            // to check wheather the user already exist with that email id
            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            // if user doesn't exist, then we are creating new user with User model
            user = new User({
                name,
                email,
                password,
            });

            // before saving to database, we need to encrypt the password by using bcrypt
            const salt = await bcrypt.genSalt(10);

            user.password = await bcrypt.hash(password, salt);

            // We are now saving all above details(name, email & encrypted pswd to database)
            await user.save();

            /* We are sending back a user webtoken */
            // this is the object that we want send in the token
            // token will includes logged in user id

            // We are getting this token once a new user register

            // Next we will create a login with a current created user and also get the
            // token so that we can authenticate.
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
                    res.json({ token: token })
                }
            );
            /*  */

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    },
);

module.exports = router;