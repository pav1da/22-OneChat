const express = require('express');
const router = express.Router();
const channelController = require('../controllers/channelController.js');
const auth = require('../middleware/auth.js');

router.get('/', auth, channelController.getAllChannels);
router.get('/:id', auth, channelController.getChannelById);
router.post('/', auth, channelController.createChannel);
router.put('/:id', auth, channelController.updateChannel);
router.put('/:id/toggle', auth, channelController.toggleChannel);
router.delete('/:id', auth, channelController.deleteChannel);

module.exports = router;
