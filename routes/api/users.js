const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const checkObjectId = require('../../middleware/checkObjectId');

// @route   GET api/users
// @desc    Test route
// @access  Public
router.get('/', (req, res) => res.send('Users route'));

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check(
      'password',
      'Please enter a password with 6 or more characters'
    ).isLength({ min: 6 }),
  ],
  async (req, res) => {
    // validate parameter
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // get parameters
    const { name, email, password } = req.body;

    try {
      // 1.See if user exists
      let user = await User.findOne({ email: email });
      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: 'User already exits' }] });
      }

      // 2.get users gravatar
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        name,
        email,
        avatar,
        password,
        allMsgData: new Map(),
      });

      // 3.Encrypt password

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // 4.Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: 360000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      console.log(req.body);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route    PUT api/users/friend/:id
// @desc     Add friend
// @access   Private
router.put('/friend/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const friendToAdd = await User.findById(req.params.id);

    //req.params.id
    if (!friendToAdd) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if the friend has already been added
    if (
      user.friends.some((friend) => friend.user.toString() === req.params.id)
    ) {
      return res.status(400).json({ msg: 'User already added' });
    }

    user.friends.unshift({ user: req.params.id });

    await user.save();

    return res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/users/unfriend/:id
// @desc     Delete a friend
// @access   Private
router.put('/unfriend/:id', [auth, checkObjectId('id')], async (req, res) => {
  try {
    const friendToDelete = await User.findById(req.params.id);

    //req.params.id
    if (!friendToDelete) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const user = await User.findById(req.user.id);

    // Check if the post has not yet been liked
    if (
      !user.friends.some((friend) => friend.user.toString() === req.params.id)
    ) {
      return res.status(400).json({ msg: 'Friend has not yet been added' });
    }

    // remove the friend
    user.friends = user.friends.filter(
      ({ user }) => user.toString() !== req.params.id
    );

    await user.save();

    return res.json(user.friends);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/users/msg
// @desc     get all msg data
// @access   Private
router.get('/msg', auth, async (req, res) => {
  try {
    const allMsgData = await User.findById(req.user.id).select('allMsgData');
    if (!allMsgData) {
      return res.status(404).json({ msg: 'Msg data not found' });
    }
    res.json(allMsgData);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
